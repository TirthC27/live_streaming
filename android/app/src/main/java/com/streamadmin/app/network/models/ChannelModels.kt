package com.streamadmin.app.network.models

import com.google.gson.annotations.SerializedName

data class ChannelResponse(
    @SerializedName("id") val id: String,
    @SerializedName("channelKey") val channelKey: String,
    @SerializedName("channelName") val channelName: String,
    @SerializedName("description") val description: String?,
    @SerializedName("thumbnailUrl") val thumbnailUrl: String?,
    @SerializedName("activeUrl") val activeUrl: String?,
    @SerializedName("secondaryUrl") val secondaryUrl: String?,
    @SerializedName("activeUrlLabel") val activeUrlLabel: String?,
    @SerializedName("secondaryUrlLabel") val secondaryUrlLabel: String?,
    @SerializedName("isActive") val isActive: Boolean,
    @SerializedName("displayOrder") val displayOrder: Int,
    @SerializedName("isTranscoding") val isTranscoding: Boolean?,
    @SerializedName("updatedAt") val updatedAt: String?,
)

data class UpdateChannelUrlRequest(
    val secret: String,
    val activeUrl: String?,
    val secondaryUrl: String?,
    val activeLabel: String?,
    val secondaryLabel: String?
)

data class UpdateChannelUrlResponse(
    val success: Boolean,
    val updatedChannel: ChannelResponse?
)

data class ToggleChannelRequest(
    val secret: String,
    val isActive: Boolean
)
