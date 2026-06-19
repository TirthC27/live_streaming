package com.streamadmin.app

import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.streamadmin.app.network.RetrofitClient
import com.streamadmin.app.network.models.UpdateActiveUrlRequest
import com.streamadmin.app.utils.Constants
import com.streamadmin.app.utils.PrefsManager
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DashboardActivity : AppCompatActivity() {

    // Toolbar
    private lateinit var toolbar: MaterialToolbar

    // Section 1 — Current Config
    private lateinit var tvActiveUrl: TextView
    private lateinit var tvActiveLabel: TextView
    private lateinit var tvActiveUpdatedAt: TextView
    private lateinit var tvSecondaryUrl: TextView
    private lateinit var tvSecondaryLabel: TextView
    private lateinit var btnRefreshConfig: View
    private lateinit var progressConfig: ProgressBar

    // Section 2 — Update Active URL
    private lateinit var etActiveLabel: EditText
    private lateinit var etActiveUrl: EditText
    private lateinit var btnPasteActive: Button
    private lateinit var btnUpdateActive: Button

    // Section 3 — Update Secondary URL
    private lateinit var etSecondaryLabel: EditText
    private lateinit var etSecondaryUrl: EditText
    private lateinit var btnPasteSecondary: Button
    private lateinit var btnUpdateSecondary: Button

    // Section 4 — Stream Status
    private lateinit var statusIndicatorActive: View
    private lateinit var tvStatusActive: TextView
    private lateinit var statusIndicatorSecondary: View
    private lateinit var tvStatusSecondary: TextView
    private lateinit var btnCheckActive: Button
    private lateinit var btnCheckSecondary: Button
    private lateinit var progressStatus: ProgressBar

    // Section 5 — YouTube Cache
    private lateinit var tvYoutubeCacheInfo: TextView
    private lateinit var progressYoutube: ProgressBar
    private lateinit var btnRefreshYoutube: Button

    // Cached config URLs for status checks
    private var cachedActiveUrl: String? = null
    private var cachedSecondaryUrl: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        // Set status bar color
        window.statusBarColor = Color.parseColor("#0f0f0f")

        PrefsManager.init(this)

        initViews()
        setupToolbar()
        setupSection1()
        setupSection2()
        setupSection3()
        setupSection4()
        setupSection5()

        // Load config on start
        loadStreamConfig()
    }

    private fun initViews() {
        toolbar = findViewById(R.id.toolbar)

        // Section 1
        tvActiveUrl = findViewById(R.id.tvActiveUrl)
        tvActiveLabel = findViewById(R.id.tvActiveLabel)
        tvActiveUpdatedAt = findViewById(R.id.tvActiveUpdatedAt)
        tvSecondaryUrl = findViewById(R.id.tvSecondaryUrl)
        tvSecondaryLabel = findViewById(R.id.tvSecondaryLabel)
        btnRefreshConfig = findViewById(R.id.btnRefreshConfig)
        progressConfig = findViewById(R.id.progressConfig)

        // Section 2
        etActiveLabel = findViewById(R.id.etActiveLabel)
        etActiveUrl = findViewById(R.id.etActiveUrl)
        btnPasteActive = findViewById(R.id.btnPasteActive)
        btnUpdateActive = findViewById(R.id.btnUpdateActive)

        // Section 3
        etSecondaryLabel = findViewById(R.id.etSecondaryLabel)
        etSecondaryUrl = findViewById(R.id.etSecondaryUrl)
        btnPasteSecondary = findViewById(R.id.btnPasteSecondary)
        btnUpdateSecondary = findViewById(R.id.btnUpdateSecondary)

        // Section 4
        statusIndicatorActive = findViewById(R.id.statusIndicatorActive)
        tvStatusActive = findViewById(R.id.tvStatusActive)
        statusIndicatorSecondary = findViewById(R.id.statusIndicatorSecondary)
        tvStatusSecondary = findViewById(R.id.tvStatusSecondary)
        btnCheckActive = findViewById(R.id.btnCheckActive)
        btnCheckSecondary = findViewById(R.id.btnCheckSecondary)
        progressStatus = findViewById(R.id.progressStatus)

        // Section 5
        tvYoutubeCacheInfo = findViewById(R.id.tvYoutubeCacheInfo)
        progressYoutube = findViewById(R.id.progressYoutube)
        btnRefreshYoutube = findViewById(R.id.btnRefreshYoutube)
    }

    private fun setupToolbar() {
        setSupportActionBar(toolbar)
        toolbar.title = "Stream Manager"
        toolbar.subtitle = "StreamX Admin"
        toolbar.setTitleTextColor(Color.WHITE)
        toolbar.setSubtitleTextColor(Color.parseColor("#aaaaaa"))
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menu.add(0, 1, 0, "Logout").setShowAsAction(MenuItem.SHOW_AS_ACTION_NEVER)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            1 -> {
                performLogout()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun performLogout() {
        PrefsManager.setLoggedIn(false)
        PrefsManager.clear()
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    // ========== SECTION 1: CURRENT CONFIG ==========

    private fun setupSection1() {
        btnRefreshConfig.setOnClickListener {
            loadStreamConfig()
        }
    }

    private fun loadStreamConfig() {
        progressConfig.visibility = View.VISIBLE
        tvActiveUrl.text = "Loading..."
        tvActiveUrl.setTextColor(Color.parseColor("#aaaaaa"))

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getStreamConfig(Constants.ADMIN_SECRET)
                progressConfig.visibility = View.GONE

                if (response.isSuccessful && response.body() != null) {
                    val config = response.body()!!

                    // Active URL
                    tvActiveUrl.text = config.activeUrl
                    tvActiveUrl.setTextColor(Color.WHITE)
                    tvActiveLabel.text = "Label: ${config.activeUrlLabel}"
                    tvActiveUpdatedAt.text = "Updated: ${formatTimestamp(config.activeUrlUpdatedAt)}"

                    // Secondary URL
                    tvSecondaryUrl.text = config.secondaryUrl ?: "Not set"
                    tvSecondaryUrl.setTextColor(
                        if (config.secondaryUrl != null) Color.WHITE
                        else Color.parseColor("#666666")
                    )
                    tvSecondaryLabel.text = "Label: ${config.secondaryUrlLabel ?: "—"}"

                    // Cache for status checks
                    cachedActiveUrl = config.activeUrl
                    cachedSecondaryUrl = config.secondaryUrl

                    // Save to prefs
                    PrefsManager.setLastUrl(config.activeUrl)
                    PrefsManager.setLastUpdated(config.activeUrlUpdatedAt ?: "")
                } else {
                    tvActiveUrl.text = "Failed to load"
                    tvActiveUrl.setTextColor(Color.parseColor("#e50914"))
                    tvActiveLabel.text = "Label: —"
                    tvActiveUpdatedAt.text = "Updated: —"
                }
            } catch (e: Exception) {
                progressConfig.visibility = View.GONE
                tvActiveUrl.text = "Failed to load"
                tvActiveUrl.setTextColor(Color.parseColor("#e50914"))
                tvActiveLabel.text = "Error: ${e.localizedMessage}"
                tvActiveUpdatedAt.text = "Updated: —"
            }
        }
    }

    // ========== SECTION 2: UPDATE ACTIVE URL ==========

    private fun setupSection2() {
        btnPasteActive.setOnClickListener {
            pasteFromClipboard(etActiveUrl)
        }

        btnUpdateActive.setOnClickListener {
            val url = etActiveUrl.text.toString().trim()
            val label = etActiveLabel.text.toString().trim().ifEmpty { "Main Stream" }

            if (url.isEmpty()) {
                showSnackbar("Please enter a stream URL", isError = true)
                return@setOnClickListener
            }
            if (!url.contains(".m3u8")) {
                showSnackbar("URL must contain .m3u8", isError = true)
                return@setOnClickListener
            }

            updateActiveUrl(url, label)
        }
    }

    private fun updateActiveUrl(url: String, label: String) {
        val progressDialog = MaterialAlertDialogBuilder(this)
            .setTitle("Updating Active Stream")
            .setMessage("Updating active stream URL...")
            .setCancelable(false)
            .setView(ProgressBar(this).apply { setPadding(0, 48, 0, 48) })
            .create()
        progressDialog.show()

        lifecycleScope.launch {
            try {
                val request = UpdateActiveUrlRequest(
                    secret = Constants.ADMIN_SECRET,
                    url = url,
                    label = label
                )
                val response = RetrofitClient.apiService.updateActiveUrl(request)
                progressDialog.dismiss()

                if (response.isSuccessful && response.body()?.success == true) {
                    showSnackbar("✅ Active URL updated!", isError = false)
                    etActiveUrl.setText("")
                    etActiveLabel.setText("")
                    loadStreamConfig()
                } else {
                    showSnackbar("❌ Update failed: Server error ${response.code()}", isError = true)
                }
            } catch (e: Exception) {
                progressDialog.dismiss()
                showSnackbar("❌ Update failed: ${e.localizedMessage}", isError = true)
            }
        }
    }

    // ========== SECTION 3: UPDATE SECONDARY URL ==========

    private fun setupSection3() {
        btnPasteSecondary.setOnClickListener {
            pasteFromClipboard(etSecondaryUrl)
        }

        btnUpdateSecondary.setOnClickListener {
            val url = etSecondaryUrl.text.toString().trim()
            val label = etSecondaryLabel.text.toString().trim().ifEmpty { "Backup Stream" }

            if (url.isEmpty()) {
                showSnackbar("Please enter a stream URL", isError = true)
                return@setOnClickListener
            }
            if (!url.contains(".m3u8")) {
                showSnackbar("URL must contain .m3u8", isError = true)
                return@setOnClickListener
            }

            updateSecondaryUrl(url, label)
        }
    }

    private fun updateSecondaryUrl(url: String, label: String) {
        val progressDialog = MaterialAlertDialogBuilder(this)
            .setTitle("Updating Backup Stream")
            .setMessage("Updating secondary stream URL...")
            .setCancelable(false)
            .setView(ProgressBar(this).apply { setPadding(0, 48, 0, 48) })
            .create()
        progressDialog.show()

        lifecycleScope.launch {
            try {
                val request = UpdateActiveUrlRequest(
                    secret = Constants.ADMIN_SECRET,
                    url = url,
                    label = label
                )
                val response = RetrofitClient.apiService.updateSecondaryUrl(request)
                progressDialog.dismiss()

                if (response.isSuccessful && response.body()?.success == true) {
                    showSnackbar("✅ Secondary URL updated!", isError = false)
                    etSecondaryUrl.setText("")
                    etSecondaryLabel.setText("")
                    loadStreamConfig()
                } else {
                    showSnackbar("❌ Update failed: Server error ${response.code()}", isError = true)
                }
            } catch (e: Exception) {
                progressDialog.dismiss()
                showSnackbar("❌ Update failed: ${e.localizedMessage}", isError = true)
            }
        }
    }

    // ========== SECTION 4: STREAM STATUS ==========

    private fun setupSection4() {
        setStatusIndicatorColor(statusIndicatorActive, "#666666")
        setStatusIndicatorColor(statusIndicatorSecondary, "#666666")

        btnCheckActive.setOnClickListener {
            checkStreamStatus(cachedActiveUrl, tvStatusActive, statusIndicatorActive, "Active")
        }

        btnCheckSecondary.setOnClickListener {
            if (cachedSecondaryUrl.isNullOrEmpty()) {
                tvStatusSecondary.text = "Secondary: Not configured"
                tvStatusSecondary.setTextColor(Color.parseColor("#666666"))
                return@setOnClickListener
            }
            checkStreamStatus(cachedSecondaryUrl, tvStatusSecondary, statusIndicatorSecondary, "Secondary")
        }
    }

    private fun checkStreamStatus(url: String?, statusText: TextView, indicator: View, label: String) {
        if (url.isNullOrEmpty()) {
            statusText.text = "$label: No URL configured"
            setStatusIndicatorColor(indicator, "#666666")
            return
        }

        progressStatus.visibility = View.VISIBLE
        statusText.text = "$label: Checking..."
        setStatusIndicatorColor(indicator, "#666666")

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.checkStatus(Constants.ADMIN_SECRET)
                progressStatus.visibility = View.GONE

                if (response.isSuccessful && response.body() != null) {
                    val data = response.body()!!
                    when {
                        data.status.equals("live", ignoreCase = true) ||
                        data.status.equals("online", ignoreCase = true) -> {
                            setStatusIndicatorColor(indicator, "#00c853")
                            statusText.text = "$label: ✅ Live"
                            statusText.setTextColor(Color.parseColor("#00c853"))
                        }
                        else -> {
                            setStatusIndicatorColor(indicator, "#e50914")
                            statusText.text = "$label: ❌ Offline"
                            statusText.setTextColor(Color.parseColor("#e50914"))
                        }
                    }
                } else {
                    setStatusIndicatorColor(indicator, "#e50914")
                    statusText.text = "$label: ❌ Offline"
                    statusText.setTextColor(Color.parseColor("#e50914"))
                }
            } catch (e: Exception) {
                progressStatus.visibility = View.GONE
                setStatusIndicatorColor(indicator, "#666666")
                statusText.text = "$label: ⚠️ Could not reach server"
                statusText.setTextColor(Color.parseColor("#ff9800"))
            }
        }
    }

    private fun setStatusIndicatorColor(view: View, colorHex: String) {
        val drawable = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor(colorHex))
        }
        view.background = drawable
    }

    // ========== SECTION 5: YOUTUBE CACHE ==========

    private fun setupSection5() {
        btnRefreshYoutube.setOnClickListener {
            forceRefreshYoutube()
        }
    }

    private fun forceRefreshYoutube() {
        progressYoutube.visibility = View.VISIBLE
        tvYoutubeCacheInfo.text = "Refreshing YouTube cache..."
        btnRefreshYoutube.isEnabled = false

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.refreshYoutube(Constants.ADMIN_SECRET)
                progressYoutube.visibility = View.GONE
                btnRefreshYoutube.isEnabled = true

                if (response.isSuccessful && response.body() != null) {
                    val data = response.body()!!
                    val liveCount = data.links.count { it.isLive }
                    val totalCount = data.links.size
                    val fetchTime = formatTimestamp(data.fetchedAt)

                    tvYoutubeCacheInfo.text = "✅ Refreshed: $liveCount/$totalCount channels live\nFetched at: $fetchTime"
                    tvYoutubeCacheInfo.setTextColor(Color.parseColor("#00c853"))

                    showSnackbar("✅ YouTube cache refreshed! $liveCount channels live", isError = false)
                } else {
                    tvYoutubeCacheInfo.text = "❌ Refresh failed: ${response.code()}"
                    tvYoutubeCacheInfo.setTextColor(Color.parseColor("#e50914"))
                }
            } catch (e: Exception) {
                progressYoutube.visibility = View.GONE
                btnRefreshYoutube.isEnabled = true
                tvYoutubeCacheInfo.text = "❌ Refresh failed: ${e.localizedMessage}"
                tvYoutubeCacheInfo.setTextColor(Color.parseColor("#e50914"))
            }
        }
    }

    // ========== UTILITIES ==========

    private fun pasteFromClipboard(editText: EditText) {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = clipboard.primaryClip
        if (clip != null && clip.itemCount > 0) {
            val pastedText = clip.getItemAt(0).text?.toString() ?: ""
            editText.setText(pastedText)
            editText.setSelection(pastedText.length)
            showSnackbar("Pasted from clipboard", isError = false)
        } else {
            showSnackbar("Clipboard is empty", isError = true)
        }
    }

    private fun showSnackbar(message: String, isError: Boolean) {
        val snackbar = Snackbar.make(
            findViewById(android.R.id.content),
            message,
            Snackbar.LENGTH_LONG
        )
        if (isError) {
            snackbar.setBackgroundTint(Color.parseColor("#e50914"))
        } else {
            snackbar.setBackgroundTint(Color.parseColor("#1b5e20"))
        }
        snackbar.setTextColor(Color.WHITE)
        snackbar.show()
    }

    private fun formatTimestamp(timestamp: String?): String {
        if (timestamp.isNullOrEmpty()) return "—"
        return try {
            val inputFormats = listOf(
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()),
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault()),
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.getDefault()),
                SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
            )
            val outputFormat = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault())

            for (fmt in inputFormats) {
                try {
                    val date = fmt.parse(timestamp)
                    if (date != null) return outputFormat.format(date)
                } catch (_: Exception) { }
            }
            timestamp
        } catch (e: Exception) {
            timestamp
        }
    }
}
