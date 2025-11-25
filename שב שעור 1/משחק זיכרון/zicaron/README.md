# Memory Game

Simple memory (matching) game implemented in HTML/CSS/JavaScript.

How to run
- Open `index.html` in any modern browser.
- Choose a time limit and press `Restart` to start a new game.

Sound and animation
- Background music plays during the game. Use the speaker button next to `Restart` to mute/unmute. The game will only start audio after your first click (browser autoplay rules).
- When you reveal a matching pair the matched cards animate with a celebration effect and stay revealed.

Background themes
- The game has a decorative background that complements the colorful card faces. When you win the game the page switches to a bright, celebratory background and confetti effect. When time runs out the page switches to a calm but pleasant background.
- These visual states are applied automatically. Restarting the game clears the themed background.

Theme selection
- Each new game randomly picks a theme (for example: Animals, Fruits, Sweets, Sea). The board uses emoji from that theme, and the page displays a large, soft decorative emoji and color accents that match the chosen theme.
- If you'd like a UI control to pick a theme manually (instead of random selection), I can add a small selector in the controls.

Enhanced victory visuals
- The victory screen now uses a bright, animated background with radiant rays and sparkles for a joyful effect. Confetti is also launched and the large theme emoji becomes more visible during victory.

Features
- Responsive card grid (4x4 default, 3x? small screens)
- Timer with configurable limit
- Score and matches counter
- Victory modal with fanfare and confetti
- Game over modal when time runs out

Files
- `index.html` — UI and layout
- `styles.css` — styles and animations
- `script.js` — game logic, timer, sounds

Notes
- No external images — card faces use emoji for portability.
- To change difficulty, edit `pairs` in `script.js` (default 8).
