const supabase = require('./supabase');

function normalizeConfig(data) {
  return {
    id: data.id,
    activeUrl: data.active_url,
    secondaryUrl: data.secondary_url,
    activeUrlLabel: data.active_url_label,
    secondaryUrlLabel: data.secondary_url_label,
    activeUrlUpdatedAt: data.active_url_updated_at,
    secondaryUrlUpdatedAt: data.secondary_url_updated_at,
    activeResolvedUrl: data.active_resolved_url,
    activeStreamStrategy: data.active_stream_strategy || 'direct',
    activeLastCheckedAt: data.active_last_checked_at,
    activeLastCheckStatus: data.active_last_check_status,
    secondaryResolvedUrl: data.secondary_resolved_url,
    secondaryStreamStrategy: data.secondary_stream_strategy || 'direct',
    secondaryLastCheckedAt: data.secondary_last_checked_at,
    secondaryLastCheckStatus: data.secondary_last_check_status,
    updatedBy: data.updated_by,
    createdAt: data.created_at,
  };
}

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
 * Get the single-row stream config from Supabase.
 * Returns a normalized object with camelCase keys.
 */
async function getStreamConfig() {
  try {
    const { data, error } = await supabase
      .from('stream_config')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching stream config:', error.message);
      throw new Error('Failed to fetch stream config');
    }

    return normalizeConfig(data);
  } catch (err) {
    console.error('getStreamConfig error:', err.message);
    throw err;
  }
}

/**
 * Update the active stream URL and optional label.
 */
async function updateActiveUrl(url, label, inspection) {
  try {
    const config = await getStreamConfig();

    const updateData = {
      active_url: url,
      active_url_updated_at: new Date().toISOString(),
      updated_by: 'admin',
      ...getInspectionFields('active', inspection),
    };

    if (label) {
      updateData.active_url_label = label;
    }

    const { data, error } = await supabase
      .from('stream_config')
      .update(updateData)
      .eq('id', config.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating active URL:', error.message);
      throw new Error('Failed to update active URL');
    }

    console.log(`Active URL updated: ${url.substring(0, 60)}...`);
    return normalizeConfig(data);
  } catch (err) {
    console.error('updateActiveUrl error:', err.message);
    throw err;
  }
}

/**
 * Update the secondary stream URL and optional label.
 */
async function updateSecondaryUrl(url, label, inspection) {
  try {
    const config = await getStreamConfig();

    const updateData = {
      secondary_url: url,
      secondary_url_updated_at: new Date().toISOString(),
      updated_by: 'admin',
      ...getInspectionFields('secondary', inspection),
    };

    if (label) {
      updateData.secondary_url_label = label;
    }

    const { data, error } = await supabase
      .from('stream_config')
      .update(updateData)
      .eq('id', config.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating secondary URL:', error.message);
      throw new Error('Failed to update secondary URL');
    }

    console.log(`Secondary URL updated: ${url.substring(0, 60)}...`);
    return normalizeConfig(data);
  } catch (err) {
    console.error('updateSecondaryUrl error:', err.message);
    throw err;
  }
}

/**
 * Update both active and secondary URLs in a single query.
 */
async function updateBothUrls(activeUrl, secondaryUrl, activeLabel, secondaryLabel, activeInspection, secondaryInspection) {
  try {
    const config = await getStreamConfig();
    const now = new Date().toISOString();

    const updateData = {
      active_url: activeUrl,
      active_url_updated_at: now,
      secondary_url: secondaryUrl,
      secondary_url_updated_at: now,
      updated_by: 'admin',
      ...getInspectionFields('active', activeInspection),
      ...getInspectionFields('secondary', secondaryInspection),
    };

    if (activeLabel) {
      updateData.active_url_label = activeLabel;
    }
    if (secondaryLabel) {
      updateData.secondary_url_label = secondaryLabel;
    }

    const { data, error } = await supabase
      .from('stream_config')
      .update(updateData)
      .eq('id', config.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating both stream URLs:', error.message);
      throw new Error('Failed to update both stream URLs');
    }

    console.log('Both stream URLs updated');
    return normalizeConfig(data);
  } catch (err) {
    console.error('updateBothUrls error:', err.message);
    throw err;
  }
}

async function updateActiveInspection(inspection) {
  const config = await getStreamConfig();
  const { data, error } = await supabase
    .from('stream_config')
    .update(getInspectionFields('active', inspection))
    .eq('id', config.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating active inspection:', error.message);
    throw new Error('Failed to update active inspection');
  }

  return normalizeConfig(data);
}

async function updateSecondaryInspection(inspection) {
  const config = await getStreamConfig();
  const { data, error } = await supabase
    .from('stream_config')
    .update(getInspectionFields('secondary', inspection))
    .eq('id', config.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating secondary inspection:', error.message);
    throw new Error('Failed to update secondary inspection');
  }

  return normalizeConfig(data);
}

module.exports = {
  getStreamConfig,
  updateActiveUrl,
  updateSecondaryUrl,
  updateBothUrls,
  updateActiveInspection,
  updateSecondaryInspection,
};
