package com.streamadmin.app.utils

import android.content.Context
import android.content.SharedPreferences

object PrefsManager {
    private lateinit var prefs: SharedPreferences

    fun init(context: Context) {
        prefs = context.getSharedPreferences(Constants.PREF_NAME, Context.MODE_PRIVATE)
    }

    fun isLoggedIn(): Boolean = prefs.getBoolean(Constants.PREF_IS_LOGGED_IN, false)

    fun setLoggedIn(value: Boolean) {
        prefs.edit().putBoolean(Constants.PREF_IS_LOGGED_IN, value).apply()
    }

    fun getLastUrl(): String = prefs.getString(Constants.PREF_LAST_URL, "") ?: ""

    fun setLastUrl(url: String) {
        prefs.edit().putString(Constants.PREF_LAST_URL, url).apply()
    }

    fun getLastUpdated(): String = prefs.getString(Constants.PREF_LAST_UPDATED, "Never") ?: "Never"

    fun setLastUpdated(timestamp: String) {
        prefs.edit().putString(Constants.PREF_LAST_UPDATED, timestamp).apply()
    }

    fun clear() {
        prefs.edit().clear().apply()
    }
}
