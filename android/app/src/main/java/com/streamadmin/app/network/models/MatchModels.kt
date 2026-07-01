package com.streamadmin.app.network.models

import com.google.gson.annotations.SerializedName

data class ScheduledMatchResponse(
    @SerializedName("id") val id: String,
    @SerializedName("channelId") val channelId: String?,
    @SerializedName("matchTitle") val matchTitle: String,
    @SerializedName("matchDescription") val matchDescription: String?,
    @SerializedName("sportType") val sportType: String?,
    @SerializedName("scheduledStart") val scheduledStart: String,
    @SerializedName("streamOpenOffset") val streamOpenOffset: Int?,
    @SerializedName("streamCloseOffset") val streamCloseOffset: Int?,
    @SerializedName("estimatedDuration") val estimatedDuration: Int?,
    @SerializedName("isStreamOpen") val isStreamOpen: Boolean?,
    @SerializedName("isUpcoming") val isUpcoming: Boolean?,
    @SerializedName("status") val status: String?,
    @SerializedName("streamOpenTime") val streamOpenTime: String?,
    @SerializedName("streamCloseTime") val streamCloseTime: String?,
    @SerializedName("channel") val channel: MatchChannelInfo?
)

data class MatchChannelInfo(
    @SerializedName("channelKey") val channelKey: String?,
    @SerializedName("channelName") val channelName: String?
)

data class CreateMatchRequest(
    val secret: String,
    val channelKey: String,
    val matchTitle: String,
    val matchDescription: String? = null,
    val sportType: String = "football",
    val scheduledStart: String,
    val streamOpenOffset: Int = 15,
    val streamCloseOffset: Int = 30,
    val estimatedDuration: Int = 120
)

data class CreateMatchResponse(
    val success: Boolean,
    val match: ScheduledMatchResponse?
)

data class DeleteRequest(
    val secret: String
)

data class DeleteResponse(
    val success: Boolean
)
