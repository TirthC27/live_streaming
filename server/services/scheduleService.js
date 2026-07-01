const supabase = require('../supabase');

/**
 * Enrich a raw match row with computed schedule fields.
 * All times are UTC. Frontend converts to IST for display.
 */
function enrichMatch(match, channel) {
  const now = Date.now();
  const scheduledStart = new Date(match.scheduled_start).getTime();
  const openOffset = (match.stream_open_offset || 15) * 60 * 1000;
  const closeOffset = (match.stream_close_offset || 30) * 60 * 1000;
  const duration = (match.estimated_duration || 120) * 60 * 1000;

  const streamOpenTime = scheduledStart - openOffset;
  const streamCloseTime = scheduledStart + duration + closeOffset;
  const isStreamOpen = now >= streamOpenTime && now <= streamCloseTime;
  const isUpcoming = now < streamOpenTime;
  const minutesUntilOpen = isUpcoming ? Math.ceil((streamOpenTime - now) / 60000) : 0;
  const isPast = now > streamCloseTime;

  return {
    id: match.id,
    channelId: match.channel_id,
    matchTitle: match.match_title,
    matchDescription: match.match_description,
    sportType: match.sport_type,
    scheduledStart: match.scheduled_start,
    streamOpenOffset: match.stream_open_offset,
    streamCloseOffset: match.stream_close_offset,
    estimatedDuration: match.estimated_duration,
    thumbnailUrl: match.thumbnail_url,
    isPublished: match.is_published,
    createdAt: match.created_at,
    // Computed fields
    streamOpenTime: new Date(streamOpenTime).toISOString(),
    streamCloseTime: new Date(streamCloseTime).toISOString(),
    isStreamOpen,
    isUpcoming,
    isPast,
    minutesUntilOpen,
    status: isStreamOpen ? 'live' : isUpcoming ? 'upcoming' : 'closed',
    // Channel info (if joined)
    channel: channel ? {
      channelKey: channel.channel_key,
      channelName: channel.channel_name,
      isActive: channel.is_active,
      thumbnailUrl: channel.thumbnail_url,
    } : null,
  };
}

/**
 * Fetch all scheduled matches joined with their channels.
 * Schedule check happens on every request — no caching.
 */
async function getScheduledMatches() {
  const { data, error } = await supabase
    .from('scheduled_matches')
    .select('*, channels(*)')
    .eq('is_published', true)
    .order('scheduled_start', { ascending: true });

  if (error) {
    console.error('❌ Error fetching scheduled matches:', error.message);
    throw new Error('Failed to fetch scheduled matches');
  }

  return data.map((row) => {
    const channel = row.channels || null;
    return enrichMatch(row, channel);
  });
}

/**
 * Get only matches where the stream is currently open.
 */
async function getActiveMatches() {
  const all = await getScheduledMatches();
  return all.filter((m) => m.isStreamOpen);
}

/**
 * Get only upcoming matches (stream not yet open), ordered by start time.
 */
async function getUpcomingMatches() {
  const all = await getScheduledMatches();
  return all
    .filter((m) => m.isUpcoming)
    .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart));
}

/**
 * Check if any match is currently open for a given channel.
 * Used by the HLS proxy to gate stream access.
 */
async function isStreamOpenForChannel(channelKey) {
  // Get the channel ID first
  const { data: channel, error: chErr } = await supabase
    .from('channels')
    .select('id')
    .eq('channel_key', channelKey)
    .single();

  if (chErr || !channel) return { open: false, match: null };

  // Get all published matches for this channel
  const { data: matches, error: mErr } = await supabase
    .from('scheduled_matches')
    .select('*')
    .eq('channel_id', channel.id)
    .eq('is_published', true);

  if (mErr || !matches || matches.length === 0) {
    // No scheduled matches — allow stream if channel is active (backwards compat)
    const { data: ch } = await supabase
      .from('channels')
      .select('is_active')
      .eq('channel_key', channelKey)
      .single();
    
    if (ch && ch.is_active) {
      return { open: true, match: null, reason: 'no_schedule_channel_active' };
    }
    return { open: false, match: null, reason: 'no_schedule' };
  }

  const now = Date.now();
  for (const match of matches) {
    const scheduledStart = new Date(match.scheduled_start).getTime();
    const openOffset = (match.stream_open_offset || 15) * 60 * 1000;
    const closeOffset = (match.stream_close_offset || 30) * 60 * 1000;
    const duration = (match.estimated_duration || 120) * 60 * 1000;
    const streamOpenTime = scheduledStart - openOffset;
    const streamCloseTime = scheduledStart + duration + closeOffset;

    if (now >= streamOpenTime && now <= streamCloseTime) {
      return {
        open: true,
        match: enrichMatch(match, null),
      };
    }
  }

  // Find the next upcoming match to report opensAt
  const upcoming = matches
    .map((m) => {
      const start = new Date(m.scheduled_start).getTime();
      const openTime = start - (m.stream_open_offset || 15) * 60 * 1000;
      return { ...m, openTime };
    })
    .filter((m) => m.openTime > now)
    .sort((a, b) => a.openTime - b.openTime);

  const next = upcoming[0];
  return {
    open: false,
    match: null,
    opensAt: next ? new Date(next.openTime).toISOString() : null,
    nextMatch: next ? next.match_title : null,
  };
}

/**
 * Create a new scheduled match.
 */
async function createMatch(data) {
  // If channelKey is provided instead of channelId, resolve it
  let channelId = data.channelId;
  if (!channelId && data.channelKey) {
    const { data: ch, error } = await supabase
      .from('channels')
      .select('id')
      .eq('channel_key', data.channelKey)
      .single();
    if (error || !ch) throw new Error(`Channel '${data.channelKey}' not found`);
    channelId = ch.id;
  }

  if (!channelId) throw new Error('channelId or channelKey is required');

  const insertData = {
    channel_id: channelId,
    match_title: data.matchTitle,
    match_description: data.matchDescription || null,
    sport_type: data.sportType || 'football',
    scheduled_start: data.scheduledStart,
    stream_open_offset: data.streamOpenOffset ?? 15,
    stream_close_offset: data.streamCloseOffset ?? 30,
    estimated_duration: data.estimatedDuration ?? 120,
    thumbnail_url: data.thumbnailUrl || null,
    is_published: data.isPublished ?? true,
  };

  const { data: created, error } = await supabase
    .from('scheduled_matches')
    .insert(insertData)
    .select('*, channels(*)')
    .single();

  if (error) {
    console.error('❌ Error creating match:', error.message);
    throw new Error('Failed to create match');
  }

  console.log(`✅ Match created: ${created.match_title}`);
  return enrichMatch(created, created.channels);
}

/**
 * Update an existing scheduled match.
 */
async function updateMatch(id, data) {
  const updateData = {};
  if (data.matchTitle !== undefined) updateData.match_title = data.matchTitle;
  if (data.matchDescription !== undefined) updateData.match_description = data.matchDescription;
  if (data.sportType !== undefined) updateData.sport_type = data.sportType;
  if (data.scheduledStart !== undefined) updateData.scheduled_start = data.scheduledStart;
  if (data.streamOpenOffset !== undefined) updateData.stream_open_offset = data.streamOpenOffset;
  if (data.streamCloseOffset !== undefined) updateData.stream_close_offset = data.streamCloseOffset;
  if (data.estimatedDuration !== undefined) updateData.estimated_duration = data.estimatedDuration;
  if (data.thumbnailUrl !== undefined) updateData.thumbnail_url = data.thumbnailUrl;
  if (data.isPublished !== undefined) updateData.is_published = data.isPublished;
  if (data.channelId !== undefined) updateData.channel_id = data.channelId;

  const { data: updated, error } = await supabase
    .from('scheduled_matches')
    .update(updateData)
    .eq('id', id)
    .select('*, channels(*)')
    .single();

  if (error) {
    console.error('❌ Error updating match:', error.message);
    throw new Error('Failed to update match');
  }

  console.log(`✅ Match updated: ${updated.match_title}`);
  return enrichMatch(updated, updated.channels);
}

/**
 * Delete a scheduled match by ID.
 */
async function deleteMatch(id) {
  const { error } = await supabase
    .from('scheduled_matches')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error deleting match:', error.message);
    throw new Error('Failed to delete match');
  }

  console.log(`✅ Match deleted: ${id}`);
  return { success: true, id };
}

module.exports = {
  getScheduledMatches,
  getActiveMatches,
  getUpcomingMatches,
  isStreamOpenForChannel,
  createMatch,
  updateMatch,
  deleteMatch,
};
