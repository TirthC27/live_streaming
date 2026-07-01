package com.streamadmin.app.network.models

import com.google.gson.annotations.SerializedName

data class TranscodeRequest(
    val secret: String,
    val channelKey: String
)

data class TranscodeStartResponse(
    val success: Boolean,
    val channelKey: String?,
    val status: String?,
    val pid: Int?
)

data class TranscodeStopResponse(
    val success: Boolean,
    val channelKey: String?,
    val status: String?
)

data class TranscodeStatusResponse(
    @SerializedName("status") val status: Map<String, TranscodeChannelStatus>?
)

data class TranscodeChannelStatus(
    val active: Boolean,
    val pid: Int?,
    val startedAt: String?,
    val sourceUrl: String?
)
