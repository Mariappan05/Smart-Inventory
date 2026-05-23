import { NextRequest, NextResponse } from "next/server";
import { checkAndSendScheduleReminders } from "@/lib/schedule-reminders";

/**
 * API endpoint for checking and sending schedule reminders
 * This should be called daily by a cron job or scheduler
 * 
 * Optional query parameter: apiKey for authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key if configured
    const apiKey = request.headers.get("x-api-key");
    const configuredApiKey = process.env.SCHEDULE_REMINDER_API_KEY;

    if (configuredApiKey && apiKey !== configuredApiKey) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await checkAndSendScheduleReminders();

    return NextResponse.json({
      success: true,
      message: "Reminder check completed",
      result,
    });
  } catch (error) {
    console.error("Error in schedule reminder endpoint:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process reminders" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify API key if configured
    const apiKey = request.headers.get("x-api-key");
    const configuredApiKey = process.env.SCHEDULE_REMINDER_API_KEY;

    if (configuredApiKey && apiKey !== configuredApiKey) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await checkAndSendScheduleReminders();

    return NextResponse.json({
      success: true,
      message: "Reminder check completed",
      result,
    });
  } catch (error) {
    console.error("Error in schedule reminder endpoint:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process reminders" },
      { status: 500 }
    );
  }
}
