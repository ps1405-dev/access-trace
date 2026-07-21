# Auralis — Science you can hear, touch, and understand

## Track

Education

## The problem

Science labs and simulations are overwhelmingly visual. A blind or low-vision learner is often asked to infer the meaning of a graph, animation, or circuit diagram from a description after the interaction has already happened.

## The project

Auralis is an accessible, browser-native science lab. It makes the relationship between variables perceivable through three channels at once: keyboard-operable controls, live spoken explanation, and purposeful audio sonification.

It currently contains three working labs:

- **Circuit lab:** alter voltage and resistance, calculate current with Ohm's law, and hear current as pitch.
- **Motion lab:** alter starting speed and acceleration, then hear the movement become higher or lower.
- **Wave lab:** alter frequency and amplitude and hear the difference between pitch and loudness.

Each lab includes a verified explanatory insight, an audio cue, and a concept check with deterministic feedback. It is useful without a mouse and does not depend on an API or model call at runtime.

## Why it matters

This is not a visual simulation with a screen-reader label added afterward. Auralis begins with the information a learner needs to perceive: change, magnitude, relationship, and result. The product has a clear initial audience—secondary-school learners studying foundational physics—and an extensible format for chemistry, biology, mathematics, and teacher-created activities.

## How Codex and GPT-5.6 were used

Codex and GPT-5.6 were used to design the interaction model, build the Next.js application, implement keyboard-friendly controls and Web Audio sonification, and iterate on the accessible visual system. The final runtime deliberately uses verified scientific formulae rather than ungrounded generated explanations.

## Demo flow

1. Open Circuit Lab and adjust voltage and resistance.
2. Play the audio mapping, then read the live calculation.
3. Answer the concept check.
4. Switch to Motion and Wave Labs to demonstrate that each concept has a different meaningful sound mapping.
5. Use Tab and arrow keys to demonstrate independent keyboard operation.
