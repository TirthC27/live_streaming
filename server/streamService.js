const supabase = require('./supabase');

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
      console.error('❌ Error fetching stream config:', error.message);
      throw new Error('Failed to fetch stream config');
    }

    return {
      id: data.id,
      activeUrl: data.active_url,
      secondaryUrl: data.secondary_url,
      activeUrlLabel: data.active_url_label,
      secondaryUrlLabel: data.secondary_url_label,
      activeUrlUpdatedAt: data.active_url_updated_at,
      secondaryUrlUpdatedAt: data.secondary_url_updated_at,
      updatedBy: data.updated_by,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('❌ getStreamConfig error:', err.message);
    throw err;
  }
}

/**
 * Update the active stream URL and optional label.
 */
async function updateActiveUrl(url, label) {
  try {
    // Get the config row ID first
    const config = await getStreamConfig();

    const updateData = {
      active_url: url,
      active_url_updated_at: new Date().toISOString(),
      updated_by: 'admin',
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
      console.error('❌ Error updating active URL:', error.message);
      throw new Error('Failed to update active URL');
    }

    console.log(`✅ Active URL updated: ${url.substring(0, 60)}...`);

    return {
      id: data.id,
      activeUrl: data.active_url,
      secondaryUrl: data.secondary_url,
      activeUrlLabel: data.active_url_label,
      secondaryUrlLabel: data.secondary_url_label,
      activeUrlUpdatedAt: data.active_url_updated_at,
      secondaryUrlUpdatedAt: data.secondary_url_updated_at,
      updatedBy: data.updated_by,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('❌ updateActiveUrl error:', err.message);
    throw err;
  }
}

/**
 * Update the secondary stream URL and optional label.
 */
async function updateSecondaryUrl(url, label) {
  try {
    const config = await getStreamConfig();

    const updateData = {
      secondary_url: url,
      secondary_url_updated_at: new Date().toISOString(),
      updated_by: 'admin',
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
      console.error('❌ Error updating secondary URL:', error.message);
      throw new Error('Failed to update secondary URL');
    }

    console.log(`✅ Secondary URL updated: ${url.substring(0, 60)}...`);

    return {
      id: data.id,
      activeUrl: data.active_url,
      secondaryUrl: data.secondary_url,
      activeUrlLabel: data.active_url_label,
      secondaryUrlLabel: data.secondary_url_label,
      activeUrlUpdatedAt: data.active_url_updated_at,
      secondaryUrlUpdatedAt: data.secondary_url_updated_at,
      updatedBy: data.updated_by,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('❌ updateSecondaryUrl error:', err.message);
    throw err;
  }
}

/**
 * Update both active and secondary URLs in a single query.
 */
async function updateBothUrls(activeUrl, secondaryUrl, activeLabel, secondaryLabel) {
  try {
    const config = await getStreamConfig();
    const now = new Date().toISOString();

    const updateData = {
      active_url: activeUrl,
      active_url_updated_at: now,
      secondary_url: secondaryUrl,
      secondary_url_updated_at: now,
      updated_by: 'admin',
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
      console.error('❌ Error updating both URLs:', error.message);
      throw new Error('Failed to update both URLs');
    }

    console.log('✅ Both stream URLs updated');

    return {
      id: data.id,
      activeUrl: data.active_url,
      secondaryUrl: data.secondary_url,
      activeUrlLabel: data.active_url_label,
      secondaryUrlLabel: data.secondary_url_label,
      activeUrlUpdatedAt: data.active_url_updated_at,
      secondaryUrlUpdatedAt: data.secondary_url_updated_at,
      updatedBy: data.updated_by,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('❌ updateBothUrls error:', err.message);
    throw err;
  }
}

module.exports = {
  getStreamConfig,
  updateActiveUrl,
  updateSecondaryUrl,
  updateBothUrls,
};
