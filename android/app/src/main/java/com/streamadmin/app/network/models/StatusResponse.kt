package com.streamadmin.app.network.models

data class StatusResponse(
    val status: String,
    val url: String?,
    val error: String?
)
