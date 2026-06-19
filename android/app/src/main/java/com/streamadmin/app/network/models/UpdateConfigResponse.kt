package com.streamadmin.app.network.models

data class UpdateConfigResponse(
    val success: Boolean,
    val updatedConfig: StreamConfigResponse?
)
