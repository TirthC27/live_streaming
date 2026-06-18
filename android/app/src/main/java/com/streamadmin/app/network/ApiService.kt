package com.streamadmin.app.network

import com.streamadmin.app.network.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

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
}
