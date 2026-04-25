// Phrases that signal the customer is asking for a human, in EN + ES.
// Word boundaries keep words like "humanly" from matching.
const USER_HANDOFF_RE = new RegExp(
  [
    "\\bspeak (?:to|with) (?:a |an )?(?:human|person|agent|representative|someone|manager|supervisor)\\b",
    "\\btalk (?:to|with) (?:a |an )?(?:human|person|agent|representative|someone|manager|supervisor)\\b",
    "\\b(?:get|connect) (?:me )?(?:to |with )?(?:a |an )?(?:human|person|agent|representative|manager|supervisor)\\b",
    "\\bi (?:want|need) (?:to (?:speak|talk) to )?(?:a |an )?(?:human|real person|agent|manager|supervisor)\\b",
    "\\b(?:real )?human please\\b",
    "\\b(?:hablar|conversar) con (?:un[ae]? )?(?:persona|humano|agente|representante|encargad[oa]|supervisor[ae]?|gerente|alguien)\\b",
    "\\b(?:quiero|necesito) (?:hablar|atenci[oó]n) (?:con )?(?:un[ae]? )?(?:persona|humano|agente|representante|gerente)\\b",
    "\\bp[aá]same (?:con|a) (?:un[ae]? )?(?:persona|humano|agente|gerente)\\b",
    "\\bagente humano\\b",
    "\\bpersona real\\b",
  ].join("|"),
  "i",
);

export function isUserHandoffRequest(userMessage: string): boolean {
  return USER_HANDOFF_RE.test(userMessage);
}
