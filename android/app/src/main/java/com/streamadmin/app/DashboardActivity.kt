package com.streamadmin.app

import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.datepicker.MaterialDatePicker
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.google.android.material.switchmaterial.SwitchMaterial
import com.google.android.material.timepicker.MaterialTimePicker
import com.google.android.material.timepicker.TimeFormat
import com.streamadmin.app.network.RetrofitClient
import com.streamadmin.app.network.models.*
import com.streamadmin.app.utils.Constants
import com.streamadmin.app.utils.PrefsManager
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class DashboardActivity : AppCompatActivity() {

    private lateinit var rootLayout: LinearLayout
    private val channels = mutableListOf<ChannelResponse>()
    private val scheduledMatches = mutableListOf<ScheduledMatchResponse>()
    private var selectedChannelIndex = 0

    // Section 1 refs
    private lateinit var channelSpinner: Spinner
    private lateinit var tvActiveUrl: TextView
    private lateinit var tvSecondaryUrl: TextView
    private lateinit var etActiveUrl: EditText
    private lateinit var etSecondaryUrl: EditText
    private lateinit var switchActive: SwitchMaterial

    // Section 2 refs
    private lateinit var matchListContainer: LinearLayout

    // Section 3 refs
    private lateinit var transcodeContainer: LinearLayout

    // Section 4 refs
    private lateinit var statusContainer: LinearLayout

    // Section 5 refs
    private lateinit var tvYoutubeInfo: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.parseColor("#0f0f0f")
        PrefsManager.init(this)
        buildUI()
        loadChannels()
        loadMatches()
    }

    // ═══════════════════════════════════════════════════
    //  BUILD UI PROGRAMMATICALLY
    // ═══════════════════════════════════════════════════

    private fun buildUI() {
        val scrollView = ScrollView(this).apply {
            setBackgroundColor(Color.parseColor("#0f0f0f"))
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        // Toolbar
        val toolbar = MaterialToolbar(this).apply {
            setBackgroundColor(Color.parseColor("#0f0f0f"))
            title = "Stream Manager"
            subtitle = "StreamX Admin"
            setTitleTextColor(Color.WHITE)
            setSubtitleTextColor(Color.parseColor("#aaaaaa"))
        }
        rootLayout.addView(toolbar)
        setSupportActionBar(toolbar)

        // Build sections
        rootLayout.addView(buildSection1())
        rootLayout.addView(buildSection2())
        rootLayout.addView(buildSection3())
        rootLayout.addView(buildSection4())
        rootLayout.addView(buildSection5())

        // Bottom padding
        rootLayout.addView(View(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(80)
            )
        })

        scrollView.addView(rootLayout)
        setContentView(scrollView)
    }

    // ═══════════════════════════════════════════════════
    //  SECTION 1: CHANNEL MANAGER
    // ═══════════════════════════════════════════════════

    private fun buildSection1(): View {
        val card = makeCard("CHANNEL MANAGER")

        // Channel spinner
        channelSpinner = Spinner(this).apply {
            setBackgroundColor(Color.parseColor("#222222"))
            setPadding(dp(12), dp(8), dp(12), dp(8))
        }
        channelSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, pos: Int, id: Long) {
                selectedChannelIndex = pos
                refreshChannelDisplay()
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
        card.addView(channelSpinner)

        // Current URLs display
        card.addView(makeLabel("Active URL:"))
        tvActiveUrl = makeValueText("Loading...")
        card.addView(tvActiveUrl)

        card.addView(makeLabel("Secondary URL:"))
        tvSecondaryUrl = makeValueText("Loading...")
        card.addView(tvSecondaryUrl)

        // Active toggle
        switchActive = SwitchMaterial(this).apply {
            text = "Channel Active"
            setTextColor(Color.WHITE)
            setPadding(0, dp(8), 0, dp(8))
            setOnCheckedChangeListener { _, isChecked ->
                if (channels.isNotEmpty()) toggleChannel(isChecked)
            }
        }
        card.addView(switchActive)

        // Update Active URL
        card.addView(makeDivider())
        card.addView(makeLabel("Update Active URL"))
        etActiveUrl = makeEditText("Paste active .m3u8 URL")
        card.addView(etActiveUrl)
        card.addView(makeButtonRow(
            "Paste" to { pasteFromClipboard(etActiveUrl) },
            "Update Active" to { updateChannelUrl("active") }
        ))

        // Update Secondary URL
        card.addView(makeLabel("Update Secondary URL"))
        etSecondaryUrl = makeEditText("Paste secondary .m3u8 URL")
        card.addView(etSecondaryUrl)
        card.addView(makeButtonRow(
            "Paste" to { pasteFromClipboard(etSecondaryUrl) },
            "Update Secondary" to { updateChannelUrl("secondary") }
        ))

        // Refresh button
        card.addView(makeAccentButton("⟳ Refresh Channels") { loadChannels() })

        return card
    }

    // ═══════════════════════════════════════════════════
    //  SECTION 2: MATCH SCHEDULER
    // ═══════════════════════════════════════════════════

    private fun buildSection2(): View {
        val card = makeCard("MATCH SCHEDULER")

        matchListContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }
        card.addView(matchListContainer)

        card.addView(makeAccentButton("+ Add Match") { showAddMatchDialog() })
        card.addView(makeButtonRow(
            "⟳ Refresh" to { loadMatches() }
        ))

        return card
    }

    // ═══════════════════════════════════════════════════
    //  SECTION 3: TRANSCODING CONTROL
    // ═══════════════════════════════════════════════════

    private fun buildSection3(): View {
        val card = makeCard("TRANSCODING CONTROL")

        transcodeContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }
        card.addView(transcodeContainer)

        card.addView(makeAccentButton("⟳ Refresh Status") { loadTranscodeStatus() })

        // Build initial rows for 4 channels
        for (i in 1..4) {
            val channelKey = "channel$i"
            val row = makeTranscodeRow(channelKey, "Channel $i", false)
            transcodeContainer.addView(row)
        }

        return card
    }

    // ═══════════════════════════════════════════════════
    //  SECTION 4: STREAM STATUS
    // ═══════════════════════════════════════════════════

    private fun buildSection4(): View {
        val card = makeCard("STREAM STATUS")

        statusContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }
        card.addView(statusContainer)

        // Initialize 4 status rows
        for (i in 1..4) {
            statusContainer.addView(makeStatusRow("Channel $i", "Not checked"))
        }

        card.addView(makeAccentButton("Check All Channels") { checkAllChannelStatus() })

        return card
    }

    // ═══════════════════════════════════════════════════
    //  SECTION 5: YOUTUBE CACHE
    // ═══════════════════════════════════════════════════

    private fun buildSection5(): View {
        val card = makeCard("YOUTUBE CACHE")

        tvYoutubeInfo = makeValueText("Tap refresh to update YouTube cache")
        card.addView(tvYoutubeInfo)

        card.addView(makeAccentButton("🔄 Force Refresh YouTube") { forceRefreshYoutube() })

        return card
    }

    // ═══════════════════════════════════════════════════
    //  NETWORK OPERATIONS
    // ═══════════════════════════════════════════════════

    private fun loadChannels() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getChannels(Constants.ADMIN_SECRET)
                if (response.isSuccessful && response.body() != null) {
                    channels.clear()
                    channels.addAll(response.body()!!)

                    val names = channels.map { it.channelName }
                    channelSpinner.adapter = ArrayAdapter(
                        this@DashboardActivity,
                        android.R.layout.simple_spinner_dropdown_item,
                        names
                    )
                    if (channels.isNotEmpty()) {
                        channelSpinner.setSelection(selectedChannelIndex.coerceAtMost(channels.size - 1))
                        refreshChannelDisplay()
                    }
                } else {
                    showSnackbar("❌ Failed to load channels: ${response.code()}", true)
                }
            } catch (e: Exception) {
                showSnackbar("❌ Error: ${e.localizedMessage}", true)
            }
        }
    }

    private fun refreshChannelDisplay() {
        if (channels.isEmpty()) return
        val ch = channels[selectedChannelIndex]
        tvActiveUrl.text = ch.activeUrl ?: "Not set"
        tvActiveUrl.setTextColor(if (ch.activeUrl != null) Color.WHITE else Color.parseColor("#666666"))
        tvSecondaryUrl.text = ch.secondaryUrl ?: "Not set"
        tvSecondaryUrl.setTextColor(if (ch.secondaryUrl != null) Color.WHITE else Color.parseColor("#666666"))
        switchActive.isChecked = ch.isActive
    }

    private fun updateChannelUrl(which: String) {
        if (channels.isEmpty()) return
        val ch = channels[selectedChannelIndex]

        val activeUrl = if (which == "active") etActiveUrl.text.toString().trim() else null
        val secondaryUrl = if (which == "secondary") etSecondaryUrl.text.toString().trim() else null

        val urlToCheck = activeUrl ?: secondaryUrl ?: ""
        if (urlToCheck.isEmpty()) {
            showSnackbar("Please enter a URL", true)
            return
        }
        if (!urlToCheck.contains(".m3u8")) {
            showSnackbar("URL must contain .m3u8", true)
            return
        }

        lifecycleScope.launch {
            try {
                val request = UpdateChannelUrlRequest(
                    secret = Constants.ADMIN_SECRET,
                    activeUrl = activeUrl,
                    secondaryUrl = secondaryUrl,
                    activeLabel = if (which == "active") "Main" else null,
                    secondaryLabel = if (which == "secondary") "Backup" else null
                )
                val response = RetrofitClient.apiService.updateChannelUrl(ch.channelKey, request)
                if (response.isSuccessful && response.body()?.success == true) {
                    showSnackbar("✅ ${which.replaceFirstChar { it.uppercase() }} URL updated!", false)
                    etActiveUrl.setText("")
                    etSecondaryUrl.setText("")
                    loadChannels()
                } else {
                    showSnackbar("❌ Update failed: ${response.code()}", true)
                }
            } catch (e: Exception) {
                showSnackbar("❌ Error: ${e.localizedMessage}", true)
            }
        }
    }

    private fun toggleChannel(isActive: Boolean) {
        if (channels.isEmpty()) return
        val ch = channels[selectedChannelIndex]
        lifecycleScope.launch {
            try {
                val request = ToggleChannelRequest(Constants.ADMIN_SECRET, isActive)
                val response = RetrofitClient.apiService.toggleChannel(ch.channelKey, request)
                if (response.isSuccessful) {
                    showSnackbar("✅ ${ch.channelName} ${if (isActive) "activated" else "deactivated"}", false)
                    loadChannels()
                }
            } catch (e: Exception) {
                showSnackbar("❌ Toggle failed: ${e.localizedMessage}", true)
            }
        }
    }

    private fun loadMatches() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getAllMatches(Constants.ADMIN_SECRET)
                if (response.isSuccessful && response.body() != null) {
                    scheduledMatches.clear()
                    scheduledMatches.addAll(response.body()!!)
                    renderMatchList()
                }
            } catch (e: Exception) {
                showSnackbar("❌ Error loading matches: ${e.localizedMessage}", true)
            }
        }
    }

    private fun renderMatchList() {
        matchListContainer.removeAllViews()
        if (scheduledMatches.isEmpty()) {
            matchListContainer.addView(makeValueText("No scheduled matches"))
            return
        }
        for (match in scheduledMatches) {
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(0, dp(8), 0, dp(8))
                setOnLongClickListener {
                    confirmDeleteMatch(match)
                    true
                }
            }

            val title = TextView(this).apply {
                text = match.matchTitle
                setTextColor(Color.WHITE)
                textSize = 14f
                setTypeface(null, Typeface.BOLD)
            }
            row.addView(title)

            val statusColor = when (match.status) {
                "live" -> "#00c853"
                "upcoming" -> "#ff9800"
                else -> "#666666"
            }
            val info = TextView(this).apply {
                text = "${match.channel?.channelName ?: "?"} · ${formatTimestamp(match.scheduledStart)} · ${match.status?.uppercase() ?: "?"}"
                setTextColor(Color.parseColor(statusColor))
                textSize = 11f
                setPadding(0, dp(2), 0, 0)
            }
            row.addView(info)

            val hint = TextView(this).apply {
                text = "Long press to delete"
                setTextColor(Color.parseColor("#444444"))
                textSize = 9f
            }
            row.addView(hint)

            matchListContainer.addView(row)
            matchListContainer.addView(makeDivider())
        }
    }

    private fun showAddMatchDialog() {
        if (channels.isEmpty()) {
            showSnackbar("Load channels first", true)
            return
        }

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(16), dp(24), dp(8))
        }

        // Channel selector
        val chSpinner = Spinner(this)
        chSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, channels.map { it.channelName })
        container.addView(makeLabel("Channel"))
        container.addView(chSpinner)

        // Title
        val etTitle = makeEditText("Match title (e.g. Real Madrid vs Barcelona)")
        container.addView(makeLabel("Match Title"))
        container.addView(etTitle)

        // Date & time display
        val tvDateTime = makeValueText("Tap buttons below to set date & time")
        container.addView(tvDateTime)

        var selectedDate: Long? = null
        var selectedHour = 20
        var selectedMinute = 0

        // Date picker button
        val btnDate = Button(this).apply {
            text = "Pick Date"
            setOnClickListener {
                val picker = MaterialDatePicker.Builder.datePicker()
                    .setTitleText("Match Date")
                    .build()
                picker.addOnPositiveButtonClickListener { millis ->
                    selectedDate = millis
                    val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
                    cal.timeInMillis = millis
                    tvDateTime.text = "Date: ${SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(cal.time)} | Time: ${String.format("%02d:%02d", selectedHour, selectedMinute)}"
                }
                picker.show(supportFragmentManager, "date")
            }
        }
        container.addView(btnDate)

        // Time picker button
        val btnTime = Button(this).apply {
            text = "Pick Time (IST)"
            setOnClickListener {
                val picker = MaterialTimePicker.Builder()
                    .setTimeFormat(TimeFormat.CLOCK_24H)
                    .setHour(20)
                    .setMinute(0)
                    .setTitleText("Match Start Time (IST)")
                    .build()
                picker.addOnPositiveButtonClickListener {
                    selectedHour = picker.hour
                    selectedMinute = picker.minute
                    tvDateTime.text = tvDateTime.text.toString().replace(Regex("Time: .*"), "Time: ${String.format("%02d:%02d", selectedHour, selectedMinute)}")
                }
                picker.show(supportFragmentManager, "time")
            }
        }
        container.addView(btnTime)

        // Duration
        val etDuration = makeEditText("120")
        etDuration.inputType = InputType.TYPE_CLASS_NUMBER
        etDuration.setText("120")
        container.addView(makeLabel("Duration (minutes)"))
        container.addView(etDuration)

        // Open offset
        val etOffset = makeEditText("15")
        etOffset.inputType = InputType.TYPE_CLASS_NUMBER
        etOffset.setText("15")
        container.addView(makeLabel("Open before match (minutes)"))
        container.addView(etOffset)

        MaterialAlertDialogBuilder(this)
            .setTitle("Schedule Match")
            .setView(container)
            .setPositiveButton("Create") { _, _ ->
                val title = etTitle.text.toString().trim()
                if (title.isEmpty()) {
                    showSnackbar("Title required", true)
                    return@setPositiveButton
                }
                if (selectedDate == null) {
                    showSnackbar("Date required", true)
                    return@setPositiveButton
                }

                // Build ISO date string — convert IST to UTC
                val cal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Kolkata"))
                cal.timeInMillis = selectedDate!!
                cal.set(Calendar.HOUR_OF_DAY, selectedHour)
                cal.set(Calendar.MINUTE, selectedMinute)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)

                val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault())
                isoFormat.timeZone = TimeZone.getTimeZone("UTC")
                val isoStr = isoFormat.format(cal.time)

                val chKey = channels[chSpinner.selectedItemPosition].channelKey
                createMatch(chKey, title, isoStr,
                    etDuration.text.toString().toIntOrNull() ?: 120,
                    etOffset.text.toString().toIntOrNull() ?: 15)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun createMatch(channelKey: String, title: String, scheduledStart: String, duration: Int, offset: Int) {
        lifecycleScope.launch {
            try {
                val request = CreateMatchRequest(
                    secret = Constants.ADMIN_SECRET,
                    channelKey = channelKey,
                    matchTitle = title,
                    scheduledStart = scheduledStart,
                    estimatedDuration = duration,
                    streamOpenOffset = offset
                )
                val response = RetrofitClient.apiService.createMatch(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    showSnackbar("✅ Match scheduled!", false)
                    loadMatches()
                } else {
                    showSnackbar("❌ Create failed: ${response.code()}", true)
                }
            } catch (e: Exception) {
                showSnackbar("❌ Error: ${e.localizedMessage}", true)
            }
        }
    }

    private fun confirmDeleteMatch(match: ScheduledMatchResponse) {
        MaterialAlertDialogBuilder(this)
            .setTitle("Delete Match")
            .setMessage("Delete \"${match.matchTitle}\"?")
            .setPositiveButton("Delete") { _, _ ->
                lifecycleScope.launch {
                    try {
                        val response = RetrofitClient.apiService.deleteMatch(
                            match.id, DeleteRequest(Constants.ADMIN_SECRET)
                        )
                        if (response.isSuccessful) {
                            showSnackbar("✅ Match deleted", false)
                            loadMatches()
                        } else {
                            showSnackbar("❌ Delete failed: ${response.code()}", true)
                        }
                    } catch (e: Exception) {
                        showSnackbar("❌ Error: ${e.localizedMessage}", true)
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun loadTranscodeStatus() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getTranscodeStatus(Constants.ADMIN_SECRET)
                if (response.isSuccessful && response.body() != null) {
                    val statusMap = response.body()!!.status ?: emptyMap()
                    transcodeContainer.removeAllViews()
                    for (i in 1..4) {
                        val key = "channel$i"
                        val name = channels.find { it.channelKey == key }?.channelName ?: "Channel $i"
                        val isActive = statusMap[key]?.active == true
                        transcodeContainer.addView(makeTranscodeRow(key, name, isActive))
                    }
                    showSnackbar("✅ Transcode status refreshed", false)
                }
            } catch (e: Exception) {
                showSnackbar("❌ Error: ${e.localizedMessage}", true)
            }
        }
    }

    private fun startTranscoding(channelKey: String) {
        lifecycleScope.launch {
            try {
                val request = TranscodeRequest(Constants.ADMIN_SECRET, channelKey)
                val response = RetrofitClient.apiService.startTranscoding(request)
                if (response.isSuccessful) {
                    showSnackbar("✅ Transcoding started for $channelKey", false)
                    loadTranscodeStatus()
                } else {
                    showSnackbar("❌ Start failed: ${response.code()}", true)
                }
            } catch (e: Exception) {
                showSnackbar("❌ Error: ${e.localizedMessage}", true)
            }
        }
    }

    private fun stopTranscoding(channelKey: String) {
        lifecycleScope.launch {
            try {
                val request = TranscodeRequest(Constants.ADMIN_SECRET, channelKey)
                val response = RetrofitClient.apiService.stopTranscoding(request)
                if (response.isSuccessful) {
                    showSnackbar("✅ Transcoding stopped for $channelKey", false)
                    loadTranscodeStatus()
                } else {
                    showSnackbar("❌ Stop failed: ${response.code()}", true)
                }
            } catch (e: Exception) {
                showSnackbar("❌ Error: ${e.localizedMessage}", true)
            }
        }
    }

    private fun checkAllChannelStatus() {
        statusContainer.removeAllViews()
        for (i in 1..4) {
            val key = "channel$i"
            val name = channels.find { it.channelKey == key }?.channelName ?: "Channel $i"
            val row = makeStatusRow(name, "Checking...")
            statusContainer.addView(row)

            lifecycleScope.launch {
                try {
                    val response = RetrofitClient.apiService.checkStatus(Constants.ADMIN_SECRET, key)
                    if (response.isSuccessful && response.body() != null) {
                        val status = response.body()!!.status
                        val isLive = status.equals("live", true) || status.equals("online", true)
                        updateStatusRow(row, name, if (isLive) "Live" else "Offline", isLive)
                    } else {
                        updateStatusRow(row, name, "Offline", false)
                    }
                } catch (e: Exception) {
                    updateStatusRow(row, name, "Error", false)
                }
            }
        }
    }

    private fun forceRefreshYoutube() {
        tvYoutubeInfo.text = "Refreshing..."
        tvYoutubeInfo.setTextColor(Color.parseColor("#aaaaaa"))

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.refreshYoutube(Constants.ADMIN_SECRET)
                if (response.isSuccessful && response.body() != null) {
                    val data = response.body()!!
                    val liveCount = data.links.count { it.isLive }
                    tvYoutubeInfo.text = "✅ Refreshed: ${liveCount}/${data.links.size} channels live\nFetched: ${formatTimestamp(data.fetchedAt)}"
                    tvYoutubeInfo.setTextColor(Color.parseColor("#00c853"))
                    showSnackbar("✅ YouTube cache refreshed!", false)
                } else {
                    tvYoutubeInfo.text = "❌ Failed: ${response.code()}"
                    tvYoutubeInfo.setTextColor(Color.parseColor("#e50914"))
                }
            } catch (e: Exception) {
                tvYoutubeInfo.text = "❌ Error: ${e.localizedMessage}"
                tvYoutubeInfo.setTextColor(Color.parseColor("#e50914"))
            }
        }
    }

    // ═══════════════════════════════════════════════════
    //  UI BUILDERS
    // ═══════════════════════════════════════════════════

    private fun makeCard(title: String): LinearLayout {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(16), dp(16), dp(16))
            val lp = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
            lp.setMargins(dp(16), dp(12), dp(16), dp(4))
            layoutParams = lp
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#1a1a1a"))
                cornerRadius = dp(12).toFloat()
            }
        }

        val header = TextView(this).apply {
            text = title
            setTextColor(Color.parseColor("#e50914"))
            textSize = 13f
            setTypeface(null, Typeface.BOLD)
            letterSpacing = 0.1f
            setPadding(0, 0, 0, dp(12))
        }
        card.addView(header)
        return card
    }

    private fun makeLabel(text: String): TextView {
        return TextView(this).apply {
            this.text = text
            setTextColor(Color.parseColor("#aaaaaa"))
            textSize = 11f
            setTypeface(null, Typeface.BOLD)
            setPadding(0, dp(10), 0, dp(4))
        }
    }

    private fun makeValueText(text: String): TextView {
        return TextView(this).apply {
            this.text = text
            setTextColor(Color.WHITE)
            textSize = 12f
            setPadding(0, dp(2), 0, dp(6))
        }
    }

    private fun makeEditText(hint: String): EditText {
        return EditText(this).apply {
            this.hint = hint
            setHintTextColor(Color.parseColor("#555555"))
            setTextColor(Color.WHITE)
            textSize = 13f
            setBackgroundColor(Color.parseColor("#222222"))
            setPadding(dp(12), dp(10), dp(12), dp(10))
            val lp = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
            lp.bottomMargin = dp(6)
            layoutParams = lp
        }
    }

    private fun makeAccentButton(text: String, onClick: () -> Unit): Button {
        return Button(this).apply {
            this.text = text
            setTextColor(Color.WHITE)
            textSize = 13f
            setTypeface(null, Typeface.BOLD)
            isAllCaps = false
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#e50914"))
                cornerRadius = dp(8).toFloat()
            }
            setPadding(dp(16), dp(10), dp(16), dp(10))
            val lp = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
            lp.topMargin = dp(8)
            layoutParams = lp
            setOnClickListener { onClick() }
        }
    }

    private fun makeButtonRow(vararg buttons: Pair<String, () -> Unit>): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            val lp = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
            lp.topMargin = dp(6)
            layoutParams = lp

            for ((label, action) in buttons) {
                val btn = Button(this@DashboardActivity).apply {
                    text = label
                    setTextColor(Color.WHITE)
                    textSize = 12f
                    isAllCaps = false
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#333333"))
                        cornerRadius = dp(6).toFloat()
                    }
                    val blp = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
                    blp.setMargins(dp(2), 0, dp(2), 0)
                    layoutParams = blp
                    setOnClickListener { action() }
                }
                addView(btn)
            }
        }
    }

    private fun makeDivider(): View {
        return View(this).apply {
            setBackgroundColor(Color.parseColor("#333333"))
            val lp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(1))
            lp.setMargins(0, dp(8), 0, dp(4))
            layoutParams = lp
        }
    }

    private fun makeTranscodeRow(channelKey: String, name: String, isActive: Boolean): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp(6), 0, dp(6))

            // Status dot
            val dot = View(this@DashboardActivity).apply {
                val dotLp = LinearLayout.LayoutParams(dp(10), dp(10))
                dotLp.marginEnd = dp(8)
                layoutParams = dotLp
                background = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(Color.parseColor(if (isActive) "#00c853" else "#666666"))
                }
            }
            addView(dot)

            // Channel name
            val tv = TextView(this@DashboardActivity).apply {
                text = name
                setTextColor(Color.WHITE)
                textSize = 13f
                val tvLp = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
                layoutParams = tvLp
            }
            addView(tv)

            // Start button
            val btnStart = Button(this@DashboardActivity).apply {
                text = "Start"
                setTextColor(Color.WHITE)
                textSize = 11f
                isAllCaps = false
                background = GradientDrawable().apply {
                    setColor(Color.parseColor("#1b5e20"))
                    cornerRadius = dp(4).toFloat()
                }
                val blp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(32))
                blp.marginEnd = dp(4)
                layoutParams = blp
                setPadding(dp(12), 0, dp(12), 0)
                setOnClickListener { startTranscoding(channelKey) }
            }
            addView(btnStart)

            // Stop button
            val btnStop = Button(this@DashboardActivity).apply {
                text = "Stop"
                setTextColor(Color.WHITE)
                textSize = 11f
                isAllCaps = false
                background = GradientDrawable().apply {
                    setColor(Color.parseColor("#b71c1c"))
                    cornerRadius = dp(4).toFloat()
                }
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(32))
                setPadding(dp(12), 0, dp(12), 0)
                setOnClickListener { stopTranscoding(channelKey) }
            }
            addView(btnStop)
        }
    }

    private fun makeStatusRow(name: String, status: String): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp(6), 0, dp(6))
            tag = "status_row"

            val dot = View(this@DashboardActivity).apply {
                val dotLp = LinearLayout.LayoutParams(dp(10), dp(10))
                dotLp.marginEnd = dp(8)
                layoutParams = dotLp
                background = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(Color.parseColor("#666666"))
                }
                tag = "status_dot"
            }
            addView(dot)

            val tv = TextView(this@DashboardActivity).apply {
                text = "$name: $status"
                setTextColor(Color.parseColor("#aaaaaa"))
                textSize = 13f
                tag = "status_text"
            }
            addView(tv)
        }
    }

    private fun updateStatusRow(row: LinearLayout, name: String, status: String, isLive: Boolean) {
        runOnUiThread {
            val dot = row.findViewWithTag<View>("status_dot")
            val tv = row.findViewWithTag<TextView>("status_text")
            (dot?.background as? GradientDrawable)?.setColor(
                Color.parseColor(if (isLive) "#00c853" else "#e50914")
            )
            tv?.text = "$name: ${if (isLive) "✅" else "❌"} $status"
            tv?.setTextColor(Color.parseColor(if (isLive) "#00c853" else "#e50914"))
        }
    }

    // ═══════════════════════════════════════════════════
    //  UTILITIES
    // ═══════════════════════════════════════════════════

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun pasteFromClipboard(editText: EditText) {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = clipboard.primaryClip
        if (clip != null && clip.itemCount > 0) {
            val pastedText = clip.getItemAt(0).text?.toString() ?: ""
            editText.setText(pastedText)
            editText.setSelection(pastedText.length)
            showSnackbar("Pasted from clipboard", false)
        } else {
            showSnackbar("Clipboard is empty", true)
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
            outputFormat.timeZone = TimeZone.getTimeZone("Asia/Kolkata")

            for (fmt in inputFormats) {
                try {
                    fmt.timeZone = TimeZone.getTimeZone("UTC")
                    val date = fmt.parse(timestamp)
                    if (date != null) return outputFormat.format(date)
                } catch (_: Exception) { }
            }
            timestamp
        } catch (e: Exception) {
            timestamp
        }
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menu.add(0, 1, 0, "Logout").setShowAsAction(MenuItem.SHOW_AS_ACTION_NEVER)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            1 -> {
                PrefsManager.setLoggedIn(false)
                PrefsManager.clear()
                val intent = Intent(this, LoginActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
}
