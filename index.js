import TWEEN, {Easing} from "./CoreTween.js";

/*  Global Game Object  */
const game = {
    tick: 0, // Game tick
    keys: {}, // Key state
    lastKeys: [], // Last 10 keys-down with timestamps: [key, time]
    m_curpos: [0,0], // Mouse cursor position
    m_lastpos: [0,0], // Mouse cursor position last frame
    m_dx: 0, // Mouse cursor delta x
    m_dy: 0, // Mouse cursor delta y
    frameDelta: 0, // Time since last frame
    lastFrameTime: 0, // Time of last frame

    // Screen X/Y deltas (Detect window movement)
    screen_dx: 0,
    screen_dy: 0,
    screen_lastpos: [0,0],
};

// Create pixi app
game.app = new PIXI.Application({ 
    background: '#1099bb',
    resizeTo: window, 
    autoDensity: false,
    antialias: false
});
const app = game.app;
document.documentElement.replaceWith(app.view);

/*
    Input Handling 
*/
function AdjustInputFlags(){
	for(var key in game.keys) {
		if (game.keys[key]&1) {
			// If key currently down, update ticks-held
			var ticksHeld = (game.keys[key]>>>16) + 1;
			game.keys[key] = (ticksHeld<<16)|(game.keys[key]&0b01);
		} else {
			// If key is released, clear event flags
			game.keys[key] &= 0xFFFF0000;
		}
	}
	game.m_dx = 0;
	game.m_dy = 0;
}
// Initialize game.lastKeys with 10 empty entries
for(var i=0;i<10;i++) {game.lastKeys.push(['',0]);};
function handleKeyEvent(e, mouse) {
	var keyCode = mouse ? 'm'+e.button : e.key;
	if ((game.keys[keyCode]&1) === 0) {
		// Set key status using bitops to avoid prematurely clearing double-press flag
		game.keys[keyCode] &= 0x0000FFFF;
		game.keys[keyCode] |= 0b11;

		// Populate key-press history
		game.lastKeys.shift();
		game.lastKeys.push([keyCode,Date.now()]);

		// Detect double-tap event (Supports multiple doubletaps at once)
		var lastKey  = game.lastKeys[9][0];
		var lastTime = game.lastKeys[9][1];
		for(var i=8;i>0;i--) {
			if(lastKey===game.lastKeys[i][0]) {
				var timeSpan = lastTime - game.lastKeys[i][1];
				if(timeSpan<200) {
					game.keys[keyCode] = 0b111;
					break;
				}
			}
		}
	}
}
window.addEventListener('mousemove', function(e) {
    // Simulate cursor position when PointerLock is enabled
    if(document.pointerLockElement) {
        game.m_curpos = [game.m_curpos[0]+e.movementX, game.m_curpos[1]-e.movementY];
    } else {
        let bounds = app.renderer.view.getBoundingClientRect();
        game.m_curpos  = [e.clientX-bounds.left-(game.width>>>1), (e.clientY-bounds.top-(game.height>>>1))];
    }
});
/*    - Mouse Buttons -
Left Mouse   : game.keys.m0
Middle Mouse : game.keys.m1
Right Mouse  : game.keys.m2  */
window.addEventListener('mouseup', function(e) {
    var keyCode = 'm'+e.button;
    game.keys[keyCode] |= 0x8;        // Set key-release bit
    game.keys[keyCode] &= 0xFFFFFFFE; // Unset key-down bit
});
window.addEventListener('mousedown', function(e) {
    handleKeyEvent(e, true);
});

// create blorb tween group
let blorb_group = new TWEEN.Group();
let blorbs = [];
function createBlorb() {
    let blorb = PIXI.Sprite.from('blorb.png');
    // interp NEAREST for pixel art
    blorb.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    blorb.acc = [0, .15];
    blorb.vel = [0, 0];
    // random velocity upwards and with a little x velocity
    blorb.vel[0] = Math.random() * .5 - .25;
    blorb.vel[1] = Math.random() * -10 - 10;

    // give blorb fancy random colors by hue shifting the base color
    let color = new PIXI.ColorMatrixFilter();
    color.hue(Math.random() * 360);
    blorb.filters = [color];

    blorbs.push(blorb);
    blorb.anchor.set(0.5); // center the sprite's anchor point
    blorb.x = app.screen.width>>>1;
    blorb.y = app.screen.height;
    app.stage.addChild(blorb);
}

function make_blorbs_fall() {
    blorb_group.removeAll();

    app.ticker.add((delta) => {
        if (document.visibilityState === 'hidden') return; // Don't update when tab is hidden

        // Loop through blorbs and apply the velocity and scale with the game.frameDelta
        const scaleMultiplier = game.frameDelta/16.6666;
        for (let blorb of blorbs) {
            // Offset the blorb position by window movement
            blorb.x -= game.screen_dx;
            blorb.y -= game.screen_dy;
            blorb.vel[0] += game.screen_dx * 0.035;
            blorb.vel[1] += game.screen_dy * 0.035;

            blorb.vel[0] += blorb.acc[0] * scaleMultiplier;
            blorb.vel[1] += blorb.acc[1] * scaleMultiplier;
            blorb.x += blorb.vel[0] * scaleMultiplier;
            blorb.y += blorb.vel[1] * scaleMultiplier;

            // If blorb < y = y reverse velocity and add friction
            if (blorb.y > (app.screen.height-8)) {
                blorb.y = app.screen.height-8;
                blorb.vel[1] *= -0.8; 
        
                // add some random y velocity jitter for fun
                blorb.vel[1] += (Math.random() * 7 - 1) * 0.5;

                // Add a little bit of random x velocity unless their y velocity is too low (if they're sitting on the ground do nothing)
                if (Math.abs(blorb.vel[1]) > 1) {
                    blorb.vel[0] += (Math.random() * 2 - 1) * 0.5;
                }

                // give 1 in 10 chance to jump towards the mouse cursor
                if (Math.random() < 0.1) {
                    let dx = game.m_curpos[0] - blorb.x;
                    let dy = game.m_curpos[1] - blorb.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    blorb.vel[0] += (dx / dist) * 5;
                    blorb.vel[1] += (dy / dist) * 5;
                }

                // dampen x velocity (after we add the random jitter)
                blorb.vel[0] *= 0.8;
            }

            // Don't allow blorbs to go off the screen
            if (blorb.x < 8) {
                blorb.x = 8;
                blorb.vel[0] *= -0.8;
            }
            if (blorb.x > (app.screen.width-8)) {
                blorb.x = app.screen.width-8;
                blorb.vel[0] *= -0.8;
            }

            // max height
            if (blorb.y < 8) {
                blorb.y = 8;
                blorb.vel[1] *= -0.8;
            }

            // Cap velocity
            if (blorb.vel[0] > 10) blorb.vel[0] = 10;
            if (blorb.vel[0] < -10) blorb.vel[0] = -10;
            if (blorb.vel[1] > 10) blorb.vel[1] = 10;
            if (blorb.vel[1] < -10) blorb.vel[1] = -10;

        }
    });
    
}

make_blorbs_fall();

// Create a timer to create blorbs every 25ms until there are 500 blorbs
let blorb_timer = new TWEEN.Tween({})
    .to({}, 100)
    .repeat(25)
    .onRepeat(() => {
        for (let i = 0; i < 5; i++) {
            createBlorb();
        }
    }).start();


// Add Congradulations text to the center of the screen
let text = new PIXI.Text('Congratulations!', {fontFamily : 'system-ui', fontSize: 80, fill : 0xffF1F1, align : 'center'});
// add outline
text.style.strokeThickness = 2;
text.anchor.set(0.5);
text.x = app.screen.width>>>1;
text.y = app.screen.height>>>1;
app.stage.addChild(text);

// Add timer to make the text bounce around the center of the screen
let text_timer = new TWEEN.Tween({})
    .to({}, 250)
    .repeat(Infinity)
    .onRepeat(() => {
        // Start another tween to move the text to a random position
        new TWEEN.Tween(text)
            .to({x: Math.random() * 25 - 25/2 + app.screen.width>>>1, y: Math.random() * 25 - 25/2 + app.screen.height>>>1}, 250)
            .easing(Easing.Linear)
            .start();
    }).start();
    
// Listen for animate update
game.lastFrameTime = performance.now();
game.frameDelta = performance.now();
game.screen_lastpos = [window.screenX, window.screenY];
app.ticker.add((delta) =>
{
    if (document.visibilityState === 'hidden') return; // Don't update when tab is hidden

    // Pre-update (Must happen before any other updates)
    game.frameDelta = performance.now() - game.lastFrameTime;
    game.lastFrameTime = performance.now();
    game.tick++;
    game.m_dx = game.m_curpos[0]-game.m_lastpos[0];
    game.m_dy = game.m_curpos[1]-game.m_lastpos[1];
    game.screen_dx = window.screenX - game.screen_lastpos[0];
    game.screen_dy = window.screenY - game.screen_lastpos[1];

    // DO STUFF HERE
    TWEEN.update(); // update main tween group
    blorb_group.update(performance.now(), true);

    // Post-update (Must happen after all other updates)
    /* NOT HANDLING INPUT FLAGS LAST WILL BREAK KEY-RELEASE DETECTION */
    AdjustInputFlags();
    game.m_lastpos = game.m_curpos;
    game.screen_lastpos = [window.screenX, window.screenY];
});
