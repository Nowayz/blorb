class Easing {
    static Linear = (t) => t;
    static EaseInQuad = (t) => t * t;
    static EaseOutQuad = (t) => t * (2 - t);
    static EaseInOutQuad = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    static EaseInCubic = (t) => t * t * t;
    static EaseOutCubic = (t) => --t * t * t + 1;
    static EaseInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    static EaseInQuart = (t) => t * t * t * t;
    static EaseOutQuart = (t) => 1 - --t * t * t * t;
    static EaseInOutQuart = (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
    static EaseInQuint = (t) => t * t * t * t * t;
    static EaseOutQuint = (t) => 1 + --t * t * t * t * t;
    static EaseInOutQuint = (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
    static EaseOutSigmoid = (a) => (t) => 0.5 / ((1 / (1 + Math.exp(-a))) - 0.5) * ((1 / (1 + Math.exp(-a * (2 * ((t + .5) / 1.5) - 1)))) - 0.5) + 0.5;
    static EaseSigmoid = (a) => (t) => 0.5 / ((1 / (1 + Math.exp(-a))) - 0.5) * ((1 / (1 + Math.exp(-a * (2 * t - 1)))) - 0.5) + 0.5; // Pass parameter 'a' to specify tightness
    static EaseSmoothStep = (t) => 3 * t * t - 2 * t * t * t;
    static EaseOutSine = (t) => Math.sin(t * (Math.PI / 2));
    static EaseInSine = (t) => Math.sin(t * Math.PI * .5 - Math.PI * .5) + 1;
    static EaseInOutSine = (t) => Math.sin(t * Math.PI - Math.PI * .5) * .5 + .5;
    static EaseOutCircle = (t) => 1 - Math.sqrt(1 - t * t);
    static EaseInCircle = (t) => Math.sqrt(1 - Math.pow(t - 1, 2));
    static EaseInOutCircle = (t) => t < .5 ? .5 - .5 * Math.sqrt(1 - 4 * t * t) : .5 + Math.sqrt(1 - Math.pow((t - 1) * 2, 2)) * .5;
    static EaseInOutInvCircle = (t) => t < .5 ? Math.sqrt(-(t - 1) * t) : 1 - Math.sqrt(-(t - 1) * t);
    static EaseBackOut = (p) => (t) => --t * t * ((p + 1) * t + p) + 1;
    static EaseOutElastic = (power, elasticity) => (t) => {
        const scaleFactor = 0.175 * elasticity + 0.0875;
        const phaseShift = power / 4;
        const maxValue = Math.sin((scaleFactor - phaseShift) * (2 * Math.PI) / power) * Math.pow(2, -10 * scaleFactor) + 1;
        t *= scaleFactor;
        const sb = Math.sin((t - phaseShift) * (2 * Math.PI) / power);
        const value = sb * Math.pow(2, -10 * t) + 1;
        return value / maxValue;
    }
};

class TweenGroup {
    constructor() {
        this.tweens = new Set();
    }

    getAll() {
        return Array.from(this.tweens);
    }
    removeAll() {
        this.tweens.clear();
    }

    add(tween) {
        this.tweens.add(tween);
    }

    remove(tween) {
        this.tweens.delete(tween);
    }

    update(time = performance.now(), preserve = false) {
        if (this.tweens.size === 0) {
            return false;
        }
        for (const tween of this.tweens) {
            const autoStart = !preserve;
            if (tween.update(time, autoStart) === false && !preserve) {
                this.tweens.delete(tween);
            }
        }
        return true;
    }
}

class Interpolation {
    static factorial = (() => {
        const a = [1];
        return function (n) {
            if (a[n])
                return a[n];
            let s = 1;
            for (let i = n; i > 1; i--)
                s *= i;
            a[n] = s;
            return s;
        };
    })();

    static bernstein = (n, i) => {
        return Interpolation.factorial(n) / (Interpolation.factorial(i) * Interpolation.factorial(n - i));
    }

    static Linear(v, k) {
        const m = v.length - 1;
        const f = m * k;
        const i = Math.floor(f);
        if (k < 0)
            return (v[1] - v[0]) * f + v[0];
        if (k > 1)
            return ((v[m - 1]) - v[m]) * (m - f) + v[m];
        return (v[i + 1 > m ? m : i + 1] - v[i]) * (f - i) + v[i];
    }

    static Bezier(v, k) {
        let b = 0;
        const n = v.length - 1;
        for (let i = 0; i <= n; i++)
            b += Math.pow(1 - k, n - i) * Math.pow(k, i) * v[i] * this.bernstein(n, i);
        return b;
    }

    static CatmullRom(v, k) {
        const m = v.length - 1;
        const f = m * k;
        const i = Math.floor(f);
        if (v[0] === v[m]) {
            if (k < 0)
                return this.catmullRomInterp(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], m * (1 + k) - f);
            return this.catmullRomInterp(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);
        }
        if (k < 0)
            return v[0] - (this.catmullRomInterp(v[0], v[0], v[1], v[1], -f) - v[0]);
        if (k > 1)
            return v[m] - (this.catmullRomInterp(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
        return this.catmullRomInterp(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
    }

    static catmullRomInterp = (p0, p1, p2, p3, t) => {
        const v0 = (p2 - p0) * 0.5;
        const v1 = (p3 - p1) * 0.5;
        const t2 = t * t;
        const t3 = t * t2;
        return ((2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1);
    }
}

// Create a main group to manage all tweens by default
const mainGroup = new TweenGroup(); 

class Tween {
    // Original TWEEN Props
    #object;
    #group;
    #isPaused;
    #pauseStart;
    #valuesStart;
    #valuesEnd;
    #valuesStartRepeat;
    #duration;
    #initialRepeat;
    #repeat;
    #yoyo;
    #isPlaying;
    #reversed;
    #delayTime;
    #startTime;
    #easingFunction;
    #interpolationFunction;
    #chainedTweens;
    #onStartCallbackFired;
    #isChainStopped;
    #goToEnd;
    #repeatDelayTime;

    // Promise related
    #promise;
    #promiseResolver;
    #promiseRejector;

    // Callback functions
    #onStartCallback;
    #onStopCallback
    #onUpdateCallback;
    #onCompleteCallback;
    #onRepeatCallback;

    constructor(object, group = mainGroup) {
        if (!(object instanceof Object)) throw 'First argument must be an Object';

        this.#group = group;
        this.#object = object;
        this.#isPaused = false;
        this.#pauseStart = 0;
        this.#valuesStart = {};
        this.#valuesEnd = {};
        this.#valuesStartRepeat = {};
        this.#duration = 1000;
        this.#initialRepeat = 0;
        this.#repeat = 0;
        this.#yoyo = false;
        this.#isPlaying = false;
        this.#reversed = false;
        this.#delayTime = 0;
        this.#startTime = 0;
        this.#easingFunction = Easing.Linear;
        this.#interpolationFunction = Interpolation.Linear;
        this.#chainedTweens = [];
        this.#onStartCallbackFired = false;
        this.#isChainStopped = false;
        this.#goToEnd = false;
    }

    isPlaying() {
        return this.#isPlaying;
    }

    isPaused() {
        return this.#isPaused;
    }

    to(properties, ms) {
        this.#valuesEnd = {...properties}
        this.#duration = ms;
        return this;    
    }

    duration(ms) {
        this.#duration = ms;
        return this;
    }

    async start() {
        if (this.#isPlaying) {
            return this;
        }

        // PHIL NOTE: Add promise support
        this.#promiseResolver = null;
        this.#promiseRejector = null;
        this.#promise = new Promise((res, rej) => {
            this.#promiseResolver = res;
            this.#promiseRejector = rej;
        });
        this.#promise._this = this;

        this.#group.add(this);
        this.#repeat = this.#initialRepeat;
        if (this.#reversed) {
            this.#reversed = false;
            for (const property in this.#valuesStartRepeat) {
                this.#swapEndStartRepeatValues(property);
                this.#valuesStart[property] = this.#valuesStartRepeat[property];
            }
        }
        this.#isPlaying = true;
        this.#isPaused = false;
        this.#onStartCallbackFired = false;
        this.#isChainStopped = false;
        this.#startTime = performance.now(); // PHIL NOTE: Slight modification from original, time is not passed as an argument to start (check this for issues later)
        this.#startTime += this.#delayTime;

        // PHIL NOTE: delay by this.#delayTime to avoid copying the start values before the tween should have started
        await new Promise(resolve => setTimeout(resolve, this.#delayTime));
        this.#setupProperties(this.#object, this.#valuesStart, this.#valuesEnd, this.#valuesStartRepeat);
        return this.#promise;
    }

    #setupProperties(object, valuesStart, valuesEnd, valuesStartRepeat) {
        for (const property in valuesEnd) {
            const startValue = object[property];
            const startValueIsArray = Array.isArray(startValue);
            const isInterpolationList = !startValueIsArray && Array.isArray(valuesEnd[property]);
            if ((startValue === undefined) || (startValue.constructor === Function)) {
                continue;
            }
            if (isInterpolationList) {
                let endValues = valuesEnd[property];
                if (endValues.length === 0) {
                    continue;
                }
                endValues = endValues.map(this.#handleRelativeValue.bind(this, startValue));
                valuesEnd[property] = [startValue].concat(endValues);
            }
            // handle the deepness of the values
            if (((startValue instanceof Object) || startValueIsArray) && startValue && !isInterpolationList) {
                valuesStart[property] = startValueIsArray ? [] : {};
                for (const prop in startValue) {
                    valuesStart[property][prop] = startValue[prop];
                }
                valuesStartRepeat[property] = startValueIsArray ? [] : {};
                this.#setupProperties(startValue, valuesStart[property], valuesEnd[property], valuesStartRepeat[property]);
            } else {
                // Save the starting value, but only once.
                if (valuesStart[property] === undefined) {
                    valuesStart[property] = startValue;
                }
                if (!startValueIsArray) {
                    valuesStart[property] *= 1.0;
                }
                if (isInterpolationList) {
                    valuesStartRepeat[property] = valuesEnd[property].slice().reverse();
                }
                else {
                    valuesStartRepeat[property] = valuesStart[property] || 0;
                }
            }
        }
    }    

    stop() {
        if (!this.#isChainStopped) {
            this.#isChainStopped = true;
            this.stopChainedTweens();
        }
        if (!this.#isPlaying) {
            return this;
        }
        this.#group.remove(this);
        this.#isPlaying = false;
        this.#isPaused = false;

        this.#promiseResolver(this);

        if (this.#onStopCallback) {
            this.#onStopCallback(this.#object);
        }
        return this;
    }

    end() {
        this.#goToEnd = true;
        this.update(Infinity);
        return this;
    }

    pause(time = performance.now()) {
        if (this.#isPaused || !this.#isPlaying) {
            return this;
        }
        this.#isPaused = true;
        this.#pauseStart = time;
        this.#group.remove(this);
        return this;
    }

    resume(time) {
        if (time === void 0) { time = performance.now(); }
        if (!this.#isPaused || !this.#isPlaying) {
            return this;
        }
        this.#isPaused = false;
        this.#startTime += time - this.#pauseStart;
        this.#pauseStart = 0;
        this.#group.add(this);
        return this;
    }
    
    stopChainedTweens() {
        const numChainedTweens = this.#chainedTweens.length;
        for (let i = 0; i < numChainedTweens; i++) {
            this.#chainedTweens[i].stop();
        }
        return this;
    }

    group(group) {
        this.#group = group;
        return this;
    }
    
    delay(amount) {
        this.#delayTime = amount;
        return this;
    }
    
    repeat(times) {
        this.#initialRepeat = times;
        this.#repeat = times;
        return this;
    }
    
    repeatDelay(amount) {
        this.#repeatDelayTime = amount;
        return this;
    }
    
    yoyo(yoyo) {
        this.#yoyo = yoyo;
        return this;
    }
    
    easing(easingFunction) {
        this.#easingFunction = easingFunction;
        return this;
    }
    
    interpolation(interpolationFunction) {
        this.#interpolationFunction = interpolationFunction;
        return this;
    }
    
    chain(...tweens) {
        this.#chainedTweens = tweens;
        return this;
    }
    
    onStart(callback) {
        this.#onStartCallback = callback;
        return this;
    }
    
    onUpdate(callback) {
        this.#onUpdateCallback = callback;
        return this;
    }
    
    onRepeat(callback) {
        this.#onRepeatCallback = callback;
        return this;
    }
    
    onComplete(callback) {
        this.#onCompleteCallback = callback;
        return this;
    }
    
    onStop(callback) {
        this.#onStopCallback = callback;
        return this;
    }
    
    update(time = performance.now(), autoStart = true) {
        if (this.#isPaused) return true;
        const endTime = this.#startTime + this.#duration;
        let elapsed;

        if (!this.#goToEnd && !this.#isPlaying) {
            if (time > endTime) return false;
            if (autoStart) this.start(time);
        }
        this.#goToEnd = false;

        if (time < this.#startTime) return true;
        
        if (this.#onStartCallbackFired === false) {
            if (this.#onStartCallback) {
                this.#onStartCallback(this.#object);
            }
            this.#onStartCallbackFired = true;
        }
        elapsed = (time - this.#startTime) / this.#duration;
        elapsed = this.#duration === 0 || elapsed > 1 ? 1 : elapsed;
        this.#updateProperties(this.#object, this.#valuesStart, this.#valuesEnd, this.#easingFunction(elapsed));
        if (this.#onUpdateCallback) {
            this.#onUpdateCallback(this.#object, elapsed);
        }
        if (elapsed === 1) {
            if (this.#repeat > 0) {
                if (isFinite(this.#repeat)) {
                    this.#repeat--;
                }
                // Reassign starting values, restart by making startTime = now
                for (const property in this.#valuesStartRepeat) {
                    if (!this.#yoyo && (this.#valuesEnd[property].constructor === String)) {
                        this.#valuesStartRepeat[property] = this.#valuesStartRepeat[property] + parseFloat(this.#valuesEnd[property]);
                    }
                    if (this.#yoyo) {
                        this.#swapEndStartRepeatValues(property);
                    }
                    this.#valuesStart[property] = this.#valuesStartRepeat[property];
                }
                if (this.#yoyo) {
                    this.#reversed = !this.#reversed;
                }
                if (this.#repeatDelayTime !== undefined) {
                    this.#startTime = time + this.#repeatDelayTime;
                }
                else {
                    this.#startTime = time + this.#delayTime;
                }
                if (this.#onRepeatCallback) {
                    this.#onRepeatCallback(this.#object);
                }
                return true;
            }
            else {
                // Promise support - resolve the promise
                this.#promiseResolver(this);

                if (this.#onCompleteCallback) {
                    this.#onCompleteCallback(this.#object);
                }
                const numChainedTweens = this.#chainedTweens.length;
                for (let i = 0; i < numChainedTweens; i++) {
                    // Make the chained tweens start exactly at the time they should,
                    // even if the `update()` method was called way past the duration of the tween
                    this.#chainedTweens[i].start(this.#startTime + this.#duration);
                }
                this.#isPlaying = false;
                return false;
            }
        }
        return true;
    }

    #updateProperties(obj, valuesStart, valuesEnd, value) {
        for (const property in valuesEnd) {
            // Don't update properties that do not exist in the source object
            if (valuesStart[property] === undefined) {
                continue;
            }
            const start = valuesStart[property] || 0;
            let end = valuesEnd[property];
            const startIsArray = Array.isArray(obj[property]);
            const endIsArray = Array.isArray(end);
            const isInterpolationList = !startIsArray && endIsArray;
            if (isInterpolationList) {
                obj[property] = this.#interpolationFunction(end, value);
            }
            else if (end instanceof Object) {
                this.#updateProperties(obj[property], start, end, value);
            }
            else {
                // Parses relative end values with start as base (e.g.: +10, -3)
                end = this.#handleRelativeValue(start, end);
                if (end.constructor === Number) {
                    obj[property] = start + (end - start) * value;
                }
            }
        }
    }

    #handleRelativeValue(start, end) {
        if (end.constructor !== String) {
            return end;
        }
        if (end.charAt(0) === '+' || end.charAt(0) === '-') {
            return start + parseFloat(end);
        }
        else {
            return parseFloat(end);
        }
    }

    #swapEndStartRepeatValues(property) {
        const tmp = this.#valuesStartRepeat[property];
        const endValue = this.#valuesEnd[property];
        if (endValue.constructor === String) {
            this.#valuesStartRepeat[property] = this.#valuesStartRepeat[property] + parseFloat(endValue);
        }
        else {
            this.#valuesStartRepeat[property] = this.#valuesEnd[property];
        }
        this.#valuesEnd[property] = tmp;
    }
}

// These are mostly untouched names to support legacy code using the old tweenjs library
const VERSION   = 'philv1';
const TWEEN     = mainGroup;
const getAll    = TWEEN.getAll.bind(TWEEN);
const removeAll = TWEEN.removeAll.bind(TWEEN);
const add       = TWEEN.add.bind(TWEEN);
const remove    = TWEEN.remove.bind(TWEEN);
const update    = TWEEN.update.bind(TWEEN);

const exports = {
    Easing       : Easing,
    Group        : TweenGroup,
    Interpolation: Interpolation,
    Tween        : Tween,
    VERSION      : VERSION,
    getAll       : getAll,
    removeAll    : removeAll,
    add          : add,
    remove       : remove,
    update       : update,
}

export default exports;
export { Easing, TweenGroup, Interpolation, Tween, VERSION, add, getAll, remove, removeAll, update };