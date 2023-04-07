import storage from '@system.storage';
import app from '@system.app';

export default {
    data: {
        length: 4,
        max: 4 * 4,
        matrix: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
        blank_position: 0,
        record: 0,
        recordString: "00:00",
        timer: 0,
        timerString: "00:00",
        timerID: undefined,
        popup: false,
        popupText: "",
        successText: "",
        newRecordText: ""
    },
    convertNumberToTimer(t) {
        const m = Math.floor(t / 60);
        const s = t % 60;
        return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
    },
    clearTimer() {
        if (this.timerID) {
            clearInterval(this.timerID);
        }
    },
    resetTimer() {
        this.timer = 0;
        this.timerString = "00:00";
        this.clearTimer();
        this.timerID = setInterval(() => {
            this.timer += 1;
            this.timerString = this.convertNumberToTimer(this.timer);
        }, 1000);
    },
    reset() {
        this.popup = false;
        this.resetTimer();
        this.init();
    },
    success() {
        let successFlag = true;
        for (let i = 0; i < this.matrix.length; i++) {
            successFlag = successFlag && i === (this.matrix[i].value - 1);
            if (!successFlag) {
                break;
            }
        }
        //test
        //successFlag = this.matrix[0].value === 1;
        return successFlag;
    },
    swap(p, v) {
        if (this.popup) {
            // success and reset
            this.reset();
        }
        // swap neighbour and ignore bend
        if ((Math.abs(this.blank_position - p) === 1 || Math.abs(this.blank_position - p) === this.length)
        && !(p % this.length === this.length - 1 && this.blank_position === p + 1)
        && !(p % this.length === 0 && this.blank_position === p - 1)
        ) {
            this.matrix.splice(p, 1, {
                value: this.matrix[this.blank_position].value,
                position: p,
                class: this.matrix[this.blank_position].class
            });
            this.matrix[this.blank_position].class = "";
            this.matrix[this.blank_position].value = v;
            this.blank_position = p;
        }

        if (this.success()) {
            this.popup = true;
            this.popupText = this.successText;

            clearInterval(this.timerID);

            // new record
            if (this.timer < this.record || this.record === 0) {
                this.popupText = this.newRecordText;
                this.record = this.timer;
                this.recordString = this.timerString;
                storage.set({
                    key: "best",
                    value: this.timer + "",
                });
            }
        }
    },
    init() {
        const cache = {};
        let i = 0;
        while (i < this.max) {
            const randomValue = Math.floor(Math.random() * this.max);
            if (!(randomValue in cache)) {
                const obj = {
                    value: randomValue + 1, position: i
                };
                if (randomValue === this.max - 1) {
                    obj.class = "blank";
                    this.blank_position = i;
                }
                this.matrix.splice(i, 1, obj);
                cache[randomValue] = randomValue;
                i++;
            }
        }
    },
    exit(e) {
        if (e.direction === "right") {
            app.terminate();
        }
    },
    onInit() {
        storage.get({
            key: "best",
            default: "0",
            success: (v) => {
                this.record = +v;
                this.recordString = this.convertNumberToTimer(this.record);
            }
        });
        this.successText = this.$t("strings.success");
        this.newRecordText = this.$t("strings.new_record");
        this.resetTimer();
        this.init();
    },
    onDestroy() {
        this.clearTimer();
    }
}
