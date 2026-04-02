import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import CircularProgress from "react-native-circular-progress-indicator";

interface ServingCountdownProps {
  startedAt: string | null;
}

export default function ServingCountdown({ startedAt }: ServingCountdownProps) {

    const getColor = () => {
  if (remaining > 10) return "#22c55e"; // green
  if (remaining > 5) return "#facc15"; // yellow
  return "#ef4444"; // red
};

  const TOTAL_SECONDS = 20;

  const [remaining, setRemaining] = useState(TOTAL_SECONDS);

  useEffect(() => {

    if (!startedAt) return;

    const calculate = () => {

      const start = new Date(startedAt.replace(" ", "T")).getTime();
      const now = new Date().getTime();

      let secondsPassed = Math.floor((now - start) / 1000);

      if (secondsPassed > 3600 || secondsPassed < -3600) {
        secondsPassed = 0;
      }

      const left = TOTAL_SECONDS - secondsPassed;

      setRemaining(left);
    };

    calculate();

    const interval = setInterval(calculate, 1000);

    return () => clearInterval(interval);

  }, [startedAt]);

  if (remaining <= 0) {
    return (
      <Text style={{ color: "#ef4444", fontWeight: "bold", marginTop: 10 }}>
        ⏰ You may be marked No-Show
      </Text>
    );
  }

  return (
    <View style={{ alignItems: "center", marginTop: 15 }}>
      
     <CircularProgress
  value={remaining}
  maxValue={TOTAL_SECONDS}
  radius={50}
  duration={1000}
  progressValueColor="#fff"
  activeStrokeColor={getColor()}
  inActiveStrokeColor="#374151"
  inActiveStrokeOpacity={0.2}
  title="Seconds"
  titleColor="#94a3b8"
  titleStyle={{ fontSize: 12 }}
/>

    <Text
  style={{
    marginTop: 8,
    fontWeight: "600",
    color: getColor(),
  }}
>
  Reach the counter now
</Text>

    </View>
  );
}