class TimeTimer {
    constructor() {
        this.initHTML();
    }

    createClockMinuteMark(j){
        const ele = document.createElement("div");
        ele.classList.add("mark_minute");
        ele.style.cssText = `--j: ${j};`;
        return ele;
    }

    createClock10MinuteMark(j){
        const ele = document.createElement("div");
        ele.classList.add("mark_10minutes");
        ele.style.cssText = `--j: ${j};`;
        return ele;
    }

    createClock5MinuteLavel(j){
        const ele = document.createElement("div");
        ele.classList.add("number_area");
        ele.style.cssText = `--i: ${j};`;
        const nEle = document.createElement("div");
        nEle.classList.add("number");
        nEle.style.cssText = `--i: ${j};`;
        nEle.textContent = j * 5;
        ele.appendChild(nEle);
        return ele;
    }

    setCountDownTimer(remainingSeconds, startDate){
        const min = Math.floor(remainingSeconds / 60);
        const sec = remainingSeconds % 60;
        const degs = Math.floor(360 * remainingSeconds / (60 * 60));
        document.getElementById("dateArea").textContent = `残り ${min}分 ${sec}秒`;
        document.getElementById("countDownSecond").style.cssText = `--i:${degs}`;
        document.getElementById("countDownSecondBackground").style.cssText = `--i:${degs}`;


        const takeSeconds = Math.floor((new Date() - startDate) / 1000);
        const takeMins = Math.floor(takeSeconds / 60);
        document.getElementById("branchAmPm").textContent = `${takeMins}分経過`;
    }

    initHTML() {
        const clockFaceEle = document.getElementById("clockFace");
        for(let j = 0; j <= 45; j++){
            if(j % 5 == 0){
                clockFaceEle.appendChild(this.createClock10MinuteMark(j));
            } else {
                clockFaceEle.appendChild(this.createClockMinuteMark(j));
            }
        }
        for(let j = 0; j < 12; j++){
            clockFaceEle.appendChild(this.createClock5MinuteLavel(j));
        }
    }
}

const timeTimer = new TimeTimer();