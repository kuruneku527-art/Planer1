package com.planner.smartapp

import android.Manifest
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.AlarmClock
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import java.util.ArrayList

class AndroidBridge(
    private val activity: MainActivity,
    private val webView: WebView
) {

    private val alarmManager: AlarmManager by lazy {
        activity.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    }

    @JavascriptInterface
    fun isNative(): Boolean = true

    /**
     * Check current status of POST_NOTIFICATIONS permission
     */
    @JavascriptInterface
    fun getNotificationPermissionStatus(): String {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val status = ContextCompat.checkSelfPermission(
                activity,
                Manifest.permission.POST_NOTIFICATIONS
            )
            return if (status == PackageManager.PERMISSION_GRANTED) "granted" else "denied"
        }
        return "granted" // Automatic grant on Android 12 and below
    }

    /**
     * Request Notification Permission dialog (Android 13+)
     */
    @JavascriptInterface
    fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.runOnUiThread {
                activity.notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    /**
     * Direct user to App Notification Settings in Android OS
     */
    @JavascriptInterface
    fun openNotificationSettings() {
        try {
            val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                putExtra(Settings.EXTRA_APP_PACKAGE, activity.packageName)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            activity.startActivity(intent)
        } catch (e: Exception) {
            // Fallback to general application details
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:${activity.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            activity.startActivity(intent)
        }
    }

    /**
     * Check if app has permission to schedule exact alarms (Android 12+)
     */
    @JavascriptInterface
    fun canScheduleExactAlarms(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true
        }
    }

    /**
     * Open Android Settings to grant exact alarm scheduling permission
     */
    @JavascriptInterface
    fun requestExactAlarmPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                    data = Uri.parse("package:${activity.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                activity.startActivity(intent)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Show immediate native notification
     */
    @JavascriptInterface
    fun showNotification(title: String, body: String, tag: String?, targetView: String?): Boolean {
        try {
            val notificationManager = activity.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
            val contentIntent = Intent(activity, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("targetView", targetView ?: "reminders")
            }
            val pendingIntent = PendingIntent.getActivity(
                activity,
                (tag ?: title).hashCode(),
                contentIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notification = androidx.core.app.NotificationCompat.Builder(activity, NotificationHelper.CHANNEL_REMINDER_ID)
                .setSmallIcon(android.R.drawable.ic_popup_reminder)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(androidx.core.app.NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .build()

            notificationManager.notify((tag ?: title).hashCode(), notification)
            return true
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        }
    }

    /**
     * Direct user to Battery Optimization settings for the app
     */
    @JavascriptInterface
    fun openBatteryOptimizationSettings() {
        try {
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            } else {
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:${activity.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            }
            activity.startActivity(intent)
        } catch (e: Exception) {
            try {
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:${activity.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                activity.startActivity(intent)
            } catch (e2: Exception) {
                e2.printStackTrace()
            }
        }
    }

    /**
     * Schedule an exact alarm using AlarmManager.setExactAndAllowWhileIdle
     */
    @JavascriptInterface
    fun scheduleExactAlarm(alarmJson: String): Boolean {
        try {
            val json = JSONObject(alarmJson)
            val id = json.getString("id")
            val title = json.optString("title", "یادآور پلنر")
            val message = json.optString("message", "")
            val timestamp = json.getLong("timestamp")
            val soundUri = json.optString("soundUri", "")

            val intent = Intent(activity, AlarmReceiver::class.java).apply {
                action = "com.planner.smartapp.ACTION_ALARM_TRIGGER"
                putExtra("id", id)
                putExtra("title", title)
                putExtra("message", message)
                putExtra("soundUri", soundUri)
            }

            val requestCode = id.hashCode()
            val pendingIntent = PendingIntent.getBroadcast(
                activity,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    timestamp,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    timestamp,
                    pendingIntent
                )
            }
            return true
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        }
    }

    /**
     * Cancel a scheduled alarm
     */
    @JavascriptInterface
    fun cancelAlarm(alarmId: String): Boolean {
        try {
            val intent = Intent(activity, AlarmReceiver::class.java).apply {
                action = "com.planner.smartapp.ACTION_ALARM_TRIGGER"
            }
            val pendingIntent = PendingIntent.getBroadcast(
                activity,
                alarmId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            alarmManager.cancel(pendingIntent)
            return true
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        }
    }

    /**
     * Create an alarm in the default Android Clock application via official AlarmClock Intent
     */
    @JavascriptInterface
    fun setClockAlarm(hour: Int, minutes: Int, message: String, skipUi: Boolean, daysJson: String): Boolean {
        try {
            val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
                putExtra(AlarmClock.EXTRA_HOUR, hour)
                putExtra(AlarmClock.EXTRA_MINUTES, minutes)
                putExtra(AlarmClock.EXTRA_MESSAGE, message)
                putExtra(AlarmClock.EXTRA_SKIP_UI, skipUi)

                val daysArray = JSONArray(daysJson)
                if (daysArray.length() > 0) {
                    val daysList = ArrayList<Int>()
                    for (i in 0 until daysArray.length()) {
                        daysList.add(daysArray.getInt(i))
                    }
                    putExtra(AlarmClock.EXTRA_DAYS, daysList)
                }
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            if (intent.resolveActivity(activity.packageManager) != null) {
                activity.startActivity(intent)
                return true
            }
            return false
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        }
    }

    /**
     * Open the default Android Clock application (AlarmClock.ACTION_SHOW_ALARMS)
     */
    @JavascriptInterface
    fun openClockApp(): Boolean {
        try {
            val intent = Intent(AlarmClock.ACTION_SHOW_ALARMS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            if (intent.resolveActivity(activity.packageManager) != null) {
                activity.startActivity(intent)
                return true
            }
            return false
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        }
    }

    /**
     * Pick custom alarm sound file using Android Storage Access Framework (SAF)
     */
    @JavascriptInterface
    fun pickAudioFile() {
        activity.runOnUiThread {
            try {
                val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "audio/*"
                    flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
                }
                activity.audioPickerLauncher.launch(intent)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Save backup JSON file using Android Storage Access Framework (SAF)
     */
    @JavascriptInterface
    fun saveBackupFile(jsonContent: String, defaultFilename: String) {
        activity.runOnUiThread {
            try {
                activity.setPendingBackup(jsonContent)
                val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "application/json"
                    putExtra(Intent.EXTRA_TITLE, defaultFilename)
                }
                activity.createBackupLauncher.launch(intent)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Retrieve Window Insets computed by MainActivity
     */
    @JavascriptInterface
    fun getSystemInsets(): String {
        val json = JSONObject().apply {
            put("top", activity.insetsTop)
            put("bottom", activity.insetsBottom)
            put("left", activity.insetsLeft)
            put("right", activity.insetsRight)
        }
        return json.toString()
    }

    /**
     * Dynamically update system bars (status bar & nav bar) icons brightness to match dark/light theme
     */
    @JavascriptInterface
    fun setSystemBarsTheme(isLight: Boolean) {
        activity.runOnUiThread {
            try {
                val window = activity.window
                val controller = androidx.core.view.WindowCompat.getInsetsController(window, window.decorView)
                controller.isAppearanceLightStatusBars = isLight
                controller.isAppearanceLightNavigationBars = isLight
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    @JavascriptInterface
    fun showToast(message: String) {
        activity.runOnUiThread {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        }
    }
}
