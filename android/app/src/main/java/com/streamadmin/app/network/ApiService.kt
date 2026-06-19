package com.streamadmin.app.network

import com.streamadmin.app.network.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ===== Existing endpoints (kept for backward compat) =====

    @GET("admin/stream-url")
    suspend fun getStreamUrl(
        @Header("x-admin-secret") secret: String
    ): Response<StreamUrlResponse>

    @POST("admin/update-url")
    suspend fun updateUrl(
        @Body request: UpdateUrlRequest
    ): Response<UpdateUrlResponse>

    @GET("admin/check-status")
    suspend fun checkStatus(
        @Header("x-admin-secret") secret: String
    ): Response<StatusResponse>

    // ===== New Supabase-backed endpoints =====

    @GET("admin/stream-config")
    suspend fun getStreamConfig(
        @Header("x-admin-secret") secret: String
    ): Response<StreamConfigResponse>

    @POST("admin/update-active-url")
    suspend fun updateActiveUrl(
        @Body request: UpdateActiveUrlRequest
    ): Response<UpdateConfigResponse>

    @POST("admin/update-secondary-url")
    suspend fun updateSecondaryUrl(
        @Body request: UpdateActiveUrlRequest
    ): Response<UpdateConfigResponse>

    @POST("admin/refresh-youtube")
    suspend fun refreshYoutube(
        @Header("x-admin-secret") secret: String
    ): Response<YoutubeRefreshResponse>
}
