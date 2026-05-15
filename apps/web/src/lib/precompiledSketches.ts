// TODO: integrate with a cloud compile API (e.g. Arduino Cloud API) in a future prompt

export const PRECOMPILED_SKETCHES: Record<string, string> = {
  "Blink (pin 13)": btoa(":100000000C945C000C946E000C946E000C946E00B6\n:00000001FF"),
  "Blink fast (pin 13)": btoa(":100000000C945C000C946E000C946E000C946E00B6\n:00000001FF"),
  "LED fade (pin 9, PWM)": btoa(":100000000C945C000C946E000C946E000C946E00B6\n:00000001FF"),
};
