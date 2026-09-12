package com.planner.smartapp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat

object NotificationHelper {

    const val CHANNEL_ALARM_ID = "planner_high_priority_alarm"
    const val CHANNEL_REMINDER_ID = "planner_standard_reminders"

    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // 1. High Priority Alarm Channel
            val defaultSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build()

            val alarmChannel = NotificationChannel(
                CHANNEL_ALARM_ID,
                "آلارم و هشدارهای مهم",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "پخش صدای زنگ و نمایش در صفحه قفل برای یادآورها و آلارم‌های دقیق"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 250, 500, 250, 500)
                setSound(defaultSound, audioAttributes)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }

            // 2. Standard Reminder Channel
            val reminderChannel = NotificationChannel(
                CHANNEL_REMINDER_ID,
                "یادآورهای روزانه و وظایف",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "اعلان‌های برنامه‌ریزی روزانه، عادات و پروژه‌ها"
                enableVibration(true)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PRIVATE
            }

            notificationManager.createNotificationChannel(alarmChannel)
            notificationManager.createNotificationChannel(reminderChannel)
        }
    }
}
