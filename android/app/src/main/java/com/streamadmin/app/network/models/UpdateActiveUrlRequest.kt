package com.streamadmin.app.network.models

data class UpdateActiveUrlRequest(
    val secret: String,
    val url: String,
    val label: String
)
