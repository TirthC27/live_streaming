package com.streamadmin.app

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.animation.AnimationUtils
import android.view.animation.CycleInterpolator
import android.view.animation.TranslateAnimation
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.snackbar.Snackbar
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.streamadmin.app.utils.Constants
import com.streamadmin.app.utils.PrefsManager

class LoginActivity : AppCompatActivity() {

    private lateinit var tilUsername: TextInputLayout
    private lateinit var tilPassword: TextInputLayout
    private lateinit var etUsername: TextInputEditText
    private lateinit var etPassword: TextInputEditText
    private lateinit var btnLogin: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        PrefsManager.init(this)

        // If already logged in, go to Dashboard
        if (PrefsManager.isLoggedIn()) {
            startActivity(Intent(this, DashboardActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_login)

        // Set status bar color
        window.statusBarColor = Color.parseColor("#0f0f0f")

        // Find views
        tilUsername = findViewById(R.id.tilUsername)
        tilPassword = findViewById(R.id.tilPassword)
        etUsername = findViewById(R.id.etUsername)
        etPassword = findViewById(R.id.etPassword)
        btnLogin = findViewById(R.id.btnLogin)

        btnLogin.setOnClickListener {
            val username = etUsername.text.toString().trim()
            val password = etPassword.text.toString().trim()

            // Clear previous errors
            tilUsername.error = null
            tilPassword.error = null

            // Validate not empty
            if (username.isEmpty()) {
                tilUsername.error = "Username is required"
                return@setOnClickListener
            }

            if (password.isEmpty()) {
                tilPassword.error = "Password is required"
                return@setOnClickListener
            }

            // Check credentials
            if (username == Constants.ADMIN_USERNAME && password == Constants.ADMIN_PASSWORD) {
                PrefsManager.setLoggedIn(true)
                startActivity(Intent(this, DashboardActivity::class.java))
                finish()
            } else {
                // Show snackbar
                Snackbar.make(
                    findViewById(android.R.id.content),
                    "Invalid credentials",
                    Snackbar.LENGTH_SHORT
                ).setBackgroundTint(Color.parseColor("#e50914"))
                    .setTextColor(Color.WHITE)
                    .show()

                // Shake animation on button
                val shake = TranslateAnimation(0f, 10f, 0f, 0f).apply {
                    duration = 500
                    interpolator = CycleInterpolator(4f)
                }
                btnLogin.startAnimation(shake)
            }
        }
    }
}
