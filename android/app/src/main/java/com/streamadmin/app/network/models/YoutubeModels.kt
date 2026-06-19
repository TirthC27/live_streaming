package com.streamadmin.app.network.models

data class YoutubeLink(
    val channelId: String,
    val channelName: String,
    val videoUrl: String?,
    val videoTitle: String?,
    val thumbnailUrl: String?,
    val isLive: Boolean
)

data class YoutubeRefreshResponse(
    val success: Boolean,
    val links: List<YoutubeLink>,
    val cached: Boolean,
    val fetchedAt: String?,
    val nextRefreshAt: String?
)
