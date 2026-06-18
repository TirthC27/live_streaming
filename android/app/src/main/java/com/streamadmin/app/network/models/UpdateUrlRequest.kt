package com.streamadmin.app.network.models

data class UpdateUrlRequest(
    val secret: String,
    val url: String
)
