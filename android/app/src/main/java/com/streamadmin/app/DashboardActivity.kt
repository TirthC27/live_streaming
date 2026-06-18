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
import com.streamadmin.app.network.models.UpdateUrlRequest
import com.streamadmin.app.utils.Constants
import com.streamadmin.app.utils.PrefsManager
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DashboardActivity : AppCompatActivity() {

    // Section 1 — Current Stream
    private lateinit var tvCurrentUrl: TextView
    private lateinit var tvLastUpdated: TextView
    private lateinit var tvSource: TextView
    private lateinit var btnRefresh: View
    private lateinit var progressCurrentUrl: ProgressBar

    // Section 2 — Update URL
    private lateinit var etNewUrl: EditText
    private lateinit var btnPasteClipboard: Button
    private lateinit var btnUpdateStream: Button

    // Section 3 — Stream Status
    private lateinit var statusIndicator: View
    private lateinit var tvStatusText: TextView
    private lateinit var btnCheckStatus: Button
    private lateinit var progressStatus: ProgressBar

    // Section 4 — Info
    private lateinit var tvBackendUrl: TextView
    private lateinit var tvInfoLastUpdated: TextView

    // Toolbar
    private lateinit var toolbar: MaterialToolbar

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

        // Load current URL on start
        loadCurrentUrl()
    }

    private fun initViews() {
        // Toolbar
        toolbar = findViewById(R.id.toolbar)

        // Section 1
        tvCurrentUrl = findViewById(R.id.tvCurrentUrl)
        tvLastUpdated = findViewById(R.id.tvLastUpdated)
        tvSource = findViewById(R.id.tvSource)
        btnRefresh = findViewById(R.id.btnRefresh)
        progressCurrentUrl = findViewById(R.id.progressCurrentUrl)

        // Section 2
        etNewUrl = findViewById(R.id.etNewUrl)
        btnPasteClipboard = findViewById(R.id.btnPaste)
        btnUpdateStream = findViewById(R.id.btnUpdate)

        // Section 3
        statusIndicator = findViewById(R.id.statusIndicator)
        tvStatusText = findViewById(R.id.tvStatusText)
        btnCheckStatus = findViewById(R.id.btnCheckStatus)
        progressStatus = findViewById(R.id.progressStatus)

        // Section 4
        tvBackendUrl = findViewById(R.id.tvBackendUrl)
        tvInfoLastUpdated = findViewById(R.id.tvLastUrlUpdate)
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

    // ========== SECTION 1: CURRENT STREAM ==========

    private fun setupSection1() {
        btnRefresh.setOnClickListener {
            loadCurrentUrl()
        }
    }

    private fun loadCurrentUrl() {
        progressCurrentUrl.visibility = View.VISIBLE
        tvCurrentUrl.text = "Loading..."
        tvCurrentUrl.setTextColor(Color.parseColor("#aaaaaa"))

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getStreamUrl(Constants.ADMIN_SECRET)
                progressCurrentUrl.visibility = View.GONE

                if (response.isSuccessful && response.body() != null) {
                    val data = response.body()!!
                    tvCurrentUrl.text = data.url
                    tvCurrentUrl.setTextColor(Color.WHITE)
                    tvLastUpdated.text = "Updated: ${data.updatedAt}"
                    tvSource.text = "Source: ${data.source}"

                    // Save to prefs
                    PrefsManager.setLastUrl(data.url)
                    PrefsManager.setLastUpdated(data.updatedAt)

                    // Update info section
                    tvInfoLastUpdated.text = "Last Updated: ${data.updatedAt}"
                } else {
                    tvCurrentUrl.text = "Failed to load"
                    tvCurrentUrl.setTextColor(Color.parseColor("#e50914"))
                    tvLastUpdated.text = "Updated: N/A"
                    tvSource.text = "Source: N/A"
                }
            } catch (e: Exception) {
                progressCurrentUrl.visibility = View.GONE
                tvCurrentUrl.text = "Failed to load"
                tvCurrentUrl.setTextColor(Color.parseColor("#e50914"))
                tvLastUpdated.text = "Updated: N/A"
                tvSource.text = "Error: ${e.localizedMessage}"
            }
        }
    }

    // ========== SECTION 2: UPDATE URL ==========

    private fun setupSection2() {
        btnPasteClipboard.setOnClickListener {
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = clipboard.primaryClip
            if (clip != null && clip.itemCount > 0) {
                val pastedText = clip.getItemAt(0).text?.toString() ?: ""
                etNewUrl.setText(pastedText)
                etNewUrl.setSelection(pastedText.length)
                Snackbar.make(
                    findViewById(android.R.id.content),
                    "Pasted from clipboard",
                    Snackbar.LENGTH_SHORT
                ).show()
            } else {
                Snackbar.make(
                    findViewById(android.R.id.content),
                    "Clipboard is empty",
                    Snackbar.LENGTH_SHORT
                ).show()
            }
        }

        btnUpdateStream.setOnClickListener {
            val url = etNewUrl.text.toString().trim()

            // Validate not empty
            if (url.isEmpty()) {
                Snackbar.make(
                    findViewById(android.R.id.content),
                    "Please enter a stream URL",
                    Snackbar.LENGTH_SHORT
                ).setBackgroundTint(Color.parseColor("#e50914"))
                    .setTextColor(Color.WHITE)
                    .show()
                return@setOnClickListener
            }

            // Validate contains .m3u8
            if (!url.contains(".m3u8")) {
                Snackbar.make(
                    findViewById(android.R.id.content),
                    "URL must contain .m3u8",
                    Snackbar.LENGTH_SHORT
                ).setBackgroundTint(Color.parseColor("#e50914"))
                    .setTextColor(Color.WHITE)
                    .show()
                return@setOnClickListener
            }

            updateStreamUrl(url)
        }
    }

    private fun updateStreamUrl(url: String) {
        // Show progress dialog
        val progressDialog = MaterialAlertDialogBuilder(this)
            .setTitle("Updating Stream")
            .setMessage("Updating stream URL...")
            .setCancelable(false)
            .setView(ProgressBar(this).apply {
                setPadding(0, 48, 0, 48)
            })
            .create()
        progressDialog.show()

        lifecycleScope.launch {
            try {
                val request = UpdateUrlRequest(
                    secret = Constants.ADMIN_SECRET,
                    url = url
                )
                val response = RetrofitClient.apiService.updateUrl(request)
                progressDialog.dismiss()

                if (response.isSuccessful && response.body() != null) {
                    val data = response.body()!!
                    if (data.success) {
                        Snackbar.make(
                            findViewById(android.R.id.content),
                            "✅ Stream updated successfully!",
                            Snackbar.LENGTH_LONG
                        ).setBackgroundTint(Color.parseColor("#1b5e20"))
                            .setTextColor(Color.WHITE)
                            .show()

                        // Clear input
                        etNewUrl.setText("")

                        // Save timestamp
                        val timestamp = SimpleDateFormat(
                            "yyyy-MM-dd HH:mm:ss",
                            Locale.getDefault()
                        ).format(Date())
                        PrefsManager.setLastUrl(url)
                        PrefsManager.setLastUpdated(timestamp)

                        // Reload current URL
                        loadCurrentUrl()
                    } else {
                        Snackbar.make(
                            findViewById(android.R.id.content),
                            "❌ Update failed: ${data.message}",
                            Snackbar.LENGTH_LONG
                        ).setBackgroundTint(Color.parseColor("#e50914"))
                            .setTextColor(Color.WHITE)
                            .show()
                    }
                } else {
                    Snackbar.make(
                        findViewById(android.R.id.content),
                        "❌ Update failed: Server error ${response.code()}",
                        Snackbar.LENGTH_LONG
                    ).setBackgroundTint(Color.parseColor("#e50914"))
                        .setTextColor(Color.WHITE)
                        .show()
                }
            } catch (e: Exception) {
                progressDialog.dismiss()
                Snackbar.make(
                    findViewById(android.R.id.content),
                    "❌ Update failed: ${e.localizedMessage}",
                    Snackbar.LENGTH_LONG
                ).setBackgroundTint(Color.parseColor("#e50914"))
                    .setTextColor(Color.WHITE)
                    .show()
            }
        }
    }

    // ========== SECTION 3: STREAM STATUS ==========

    private fun setupSection3() {
        // Default grey indicator
        setStatusIndicatorColor("#666666")
        tvStatusText.text = "Status: Unknown"

        btnCheckStatus.setOnClickListener {
            checkStreamStatus()
        }
    }

    private fun checkStreamStatus() {
        progressStatus.visibility = View.VISIBLE
        tvStatusText.text = "Checking..."
        setStatusIndicatorColor("#666666")

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.checkStatus(Constants.ADMIN_SECRET)
                progressStatus.visibility = View.GONE

                if (response.isSuccessful && response.body() != null) {
                    val data = response.body()!!
                    when {
                        data.status.equals("live", ignoreCase = true) ||
                        data.status.equals("online", ignoreCase = true) -> {
                            setStatusIndicatorColor("#00c853")
                            tvStatusText.text = "✅ Stream is Live"
                            tvStatusText.setTextColor(Color.parseColor("#00c853"))
                        }
                        else -> {
                            setStatusIndicatorColor("#e50914")
                            tvStatusText.text = "❌ Stream is Offline"
                            tvStatusText.setTextColor(Color.parseColor("#e50914"))
                        }
                    }
                } else {
                    setStatusIndicatorColor("#e50914")
                    tvStatusText.text = "❌ Stream is Offline"
                    tvStatusText.setTextColor(Color.parseColor("#e50914"))
                }
            } catch (e: Exception) {
                progressStatus.visibility = View.GONE
                setStatusIndicatorColor("#666666")
                tvStatusText.text = "⚠️ Could not reach server"
                tvStatusText.setTextColor(Color.parseColor("#ff9800"))
            }
        }
    }

    private fun setStatusIndicatorColor(colorHex: String) {
        val drawable = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor(colorHex))
        }
        statusIndicator.background = drawable
    }

    // ========== SECTION 4: INFO ==========

    private fun setupSection4() {
        tvBackendUrl.text = Constants.BACKEND_URL
        tvInfoLastUpdated.text = PrefsManager.getLastUpdated()
    }
}
