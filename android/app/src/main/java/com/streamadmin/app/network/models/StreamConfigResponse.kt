package com.streamadmin.app.network.models

data class StreamConfigResponse(
    val id: String?,
    val activeUrl: String,
    val secondaryUrl: String?,
    val activeUrlLabel: String,
    val secondaryUrlLabel: String?,
    val activeUrlUpdatedAt: String?,
    val secondaryUrlUpdatedAt: String?,
    val updatedBy: String?,
    val createdAt: String?
)
