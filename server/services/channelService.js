const supabase = require('../supabase');

/**
 * Normalize a raw Supabase channel row into camelCase.
 */
function normalizeChannel(data) {
  return {
    id: data.id,
    channelKey: data.channel_key,
    channelName: data.channel_name,
    description: data.description,
    thumbnailUrl: data.thumbnail_url,
    activeUrl: data.active_url,
    secondaryUrl: data.secondary_url,
    activeUrlLabel: data.active_url_label,
    secondaryUrlLabel: data.secondary_url_label,
    isActive: data.is_active,
    displayOrder: data.display_order,
    activeResolvedUrl: data.active_resolved_url,
    activeStreamStrategy: data.active_stream_strategy || 'direct',
    activeLastCheckedAt: data.active_last_checked_at,
    activeLastCheckStatus: data.active_last_check_status,
    secondaryResolvedUrl: data.secondary_resolved_url,
    secondaryStreamStrategy: data.secondary_stream_strategy || 'direct',
    secondaryLastCheckedAt: data.secondary_last_checked_at,
    secondaryLastCheckStatus: data.secondary_last_check_status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Build inspection metadata fields for a given stream prefix.
 */
function getInspectionFields(prefix, inspection) {
  const checkedAt = new Date().toISOString();

  if (!inspection) {
    return {
      [`${prefix}_resolved_url`]: null,
      [`${prefix}_stream_strategy`]: 'direct',
      [`${prefix}_last_checked_at`]: checkedAt,
      [`${prefix}_last_check_status`]: 'not_checked',
    };
  }

  return {
    [`${prefix}_resolved_url`]: inspection.isHls ? inspection.finalUrl : null,
    [`${prefix}_stream_strategy`]: inspection.strategy || 'unsupported',
    [`${prefix}_last_checked_at`]: checkedAt,
    [`${prefix}_last_check_status`]: inspection.isHls ? 'live' : 'offline',
  };
}

/**
 * Fetch all channels ordered by display_order.
 */
async function getAllChannels() {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('❌ Error fetching channels:', error.message);
    throw new Error('Failed to fetch channels');
  }

  return data.map(normalizeChannel);
}

/**
 * Fetch a single channel by its channel_key.
 */
async function getChannelByKey(channelKey) {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('channel_key', channelKey)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no rows
    console.error('❌ Error fetching channel:', error.message);
    throw new Error('Failed to fetch channel');
  }

  return normalizeChannel(data);
}

/**
 * Update a channel's stream URLs and labels.
 */
async function updateChannelUrl(channelKey, activeUrl, secondaryUrl, labels, activeInspection, secondaryInspection) {
  const channel = await getChannelByKey(channelKey);
  if (!channel) throw new Error(`Channel '${channelKey}' not found`);

  const now = new Date().toISOString();
  const updateData = {
    updated_at: now,
  };

  if (activeUrl !== undefined && activeUrl !== null) {
    updateData.active_url = activeUrl;
    Object.assign(updateData, getInspectionFields('active', activeInspection));
  }

  if (secondaryUrl !== undefined && secondaryUrl !== null) {
    updateData.secondary_url = secondaryUrl;
    Object.assign(updateData, getInspectionFields('secondary', secondaryInspection));
  }

  if (labels) {
    if (labels.activeLabel) updateData.active_url_label = labels.activeLabel;
    if (labels.secondaryLabel) updateData.secondary_url_label = labels.secondaryLabel;
  }

  const { data, error } = await supabase
    .from('channels')
    .update(updateData)
    .eq('channel_key', channelKey)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating channel URL:', error.message);
    throw new Error('Failed to update channel URL');
  }

  console.log(`✅ Channel ${channelKey} URL updated`);
  return normalizeChannel(data);
}

/**
 * Toggle a channel's is_active state.
 */
async function setChannelActive(channelKey, isActive) {
  const { data, error } = await supabase
    .from('channels')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('channel_key', channelKey)
    .select()
    .single();

  if (error) {
    console.error('❌ Error toggling channel:', error.message);
    throw new Error('Failed to toggle channel');
  }

  console.log(`✅ Channel ${channelKey} is_active = ${isActive}`);
  return normalizeChannel(data);
}

/**
 * Update inspection metadata for a specific stream on a channel.
 */
async function updateChannelInspection(channelKey, stream, inspection) {
  const prefix = stream === 'secondary' ? 'secondary' : 'active';
  const { data, error } = await supabase
    .from('channels')
    .update(getInspectionFields(prefix, inspection))
    .eq('channel_key', channelKey)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating channel inspection:', error.message);
    throw new Error('Failed to update channel inspection');
  }

  return normalizeChannel(data);
}

module.exports = {
  getAllChannels,
  getChannelByKey,
  updateChannelUrl,
  setChannelActive,
  updateChannelInspection,
  normalizeChannel,
};
