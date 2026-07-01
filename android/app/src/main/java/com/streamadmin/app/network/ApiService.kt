package com.streamadmin.app.network

import com.streamadmin.app.network.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ===== Channel Management =====

    @GET("admin/channels")
    suspend fun getChannels(
        @Header("x-admin-secret") secret: String
    ): Response<List<ChannelResponse>>

    @POST("admin/channels/{channelKey}/update-url")
    suspend fun updateChannelUrl(
        @Path("channelKey") channelKey: String,
        @Body request: UpdateChannelUrlRequest
    ): Response<UpdateChannelUrlResponse>

    @POST("admin/channels/{channelKey}/toggle")
    suspend fun toggleChannel(
        @Path("channelKey") channelKey: String,
        @Body request: ToggleChannelRequest
    ): Response<UpdateChannelUrlResponse>

    // ===== Match Scheduling =====

    @GET("matches/all")
    suspend fun getAllMatches(
        @Header("x-admin-secret") secret: String
    ): Response<List<ScheduledMatchResponse>>

    @POST("admin/matches/create")
    suspend fun createMatch(
        @Body request: CreateMatchRequest
    ): Response<CreateMatchResponse>

    @HTTP(method = "DELETE", path = "admin/matches/{id}", hasBody = true)
    suspend fun deleteMatch(
        @Path("id") id: String,
        @Body request: DeleteRequest
    ): Response<DeleteResponse>

    // ===== Transcoding =====

    @POST("admin/transcode/start")
    suspend fun startTranscoding(
        @Body request: TranscodeRequest
    ): Response<TranscodeStartResponse>

    @POST("admin/transcode/stop")
    suspend fun stopTranscoding(
        @Body request: TranscodeRequest
    ): Response<TranscodeStopResponse>

    @GET("admin/transcode/status")
    suspend fun getTranscodeStatus(
        @Header("x-admin-secret") secret: String
    ): Response<TranscodeStatusResponse>

    // ===== Stream Status =====

    @GET("admin/check-status")
    suspend fun checkStatus(
        @Header("x-admin-secret") secret: String,
        @Query("channel") channelKey: String? = null
    ): Response<StatusResponse>

    // ===== YouTube =====

    @POST("admin/refresh-youtube")
    suspend fun refreshYoutube(
        @Header("x-admin-secret") secret: String
    ): Response<YoutubeRefreshResponse>
}
