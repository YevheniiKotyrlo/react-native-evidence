#!/usr/bin/env node
// Clicks a point on an Android screen with a virtual mouse registered through
// the `uinput` shell command, then reports where the pointer landed and how
// many popup windows are open.
//
// Android scales a mouse's relative motion, so the pointer is placed
// closed-loop: the position `dumpsys input` reports for the hovering pointer
// calibrates the gain, and the pointer moves until it is within a few pixels
// of the point.
//
// usage: node tools/mouse-click.mjs <serial> <x> <y> <left|right>
// needs: adb, and a device whose `dumpsys input` lists hovering pointers (Android 15 and later)
import { execFileSync, spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const [serial, xText, yText, buttonName] = process.argv.slice(2);
if (serial === undefined || xText === undefined || yText === undefined || (buttonName !== 'left' && buttonName !== 'right')) {
  console.error('usage: node tools/mouse-click.mjs <serial> <x> <y> <left|right>');
  process.exit(2);
}
const target = { x: Number(xText), y: Number(yText) };

const DEVICE_NAME = 'evidence-mouse';
const EV_SYN = 0x00;
const EV_KEY = 0x01;
const EV_REL = 0x02;
const SYN_REPORT = 0x00;
const REL_X = 0x00;
const REL_Y = 0x01;
const BUTTONS = { left: 0x110, right: 0x111 };
const UI_SET_EVBIT = 100;
const UI_SET_KEYBIT = 101;
const UI_SET_RELBIT = 102;
const STEP_MS = 30;
const CALIBRATION_UNITS = 40;
const HOVER_PATTERN = /hoveringPointers=\[Pointer\(id=\d+, MOUSE\) at \((?<x>-?[\d.]+), (?<y>-?[\d.]+)\)\]/u;

const adb = (args) => execFileSync('adb', ['-s', serial, ...args], { encoding: 'utf8', windowsHide: true });

const session = spawn('adb', ['-s', serial, 'shell', 'uinput', '-'], { stdio: ['pipe', 'pipe', 'inherit'], windowsHide: true });
let sessionOutput = '';
session.stdout.on('data', (chunk) => {
  sessionOutput += chunk;
});

const send = (command) => {
  session.stdin.write(`${JSON.stringify(command)}\n`);
};
const inject = (events) => {
  send({ command: 'inject', events, id: 1 });
};
const delay = (duration) => {
  send({ command: 'delay', duration, id: 1 });
};
const move = (deltaX, deltaY) => {
  inject([EV_REL, REL_X, deltaX, EV_REL, REL_Y, deltaY, EV_SYN, SYN_REPORT, 0]);
};

const readHoverPosition = () => {
  const match = HOVER_PATTERN.exec(adb(['shell', 'dumpsys', 'input']));
  return match === null ? undefined : { x: Number(match.groups.x), y: Number(match.groups.y) };
};

const moveSlowly = async (deltaX, deltaY) => {
  const steps = Math.max(1, Math.abs(deltaX), Math.abs(deltaY));
  let placedX = 0;
  let placedY = 0;
  for (let step = 1; step <= steps; step += 1) {
    const nextX = Math.round((deltaX * step) / steps);
    const nextY = Math.round((deltaY * step) / steps);
    move(nextX - placedX, nextY - placedY);
    placedX = nextX;
    placedY = nextY;
    delay(STEP_MS);
  }
  await sleep(steps * (STEP_MS + 4) + 1200);
};

send({
  bus: 'usb',
  command: 'register',
  configuration: [
    { type: UI_SET_EVBIT, data: [EV_KEY, EV_REL] },
    { type: UI_SET_KEYBIT, data: [BUTTONS.left, BUTTONS.right] },
    { type: UI_SET_RELBIT, data: [REL_X, REL_Y] },
  ],
  id: 1,
  name: DEVICE_NAME,
  pid: 2,
  vid: 0x1209,
});

let registered = false;
for (let attempt = 0; attempt < 50 && !registered; attempt += 1) {
  registered = adb(['shell', 'dumpsys', 'input']).includes(DEVICE_NAME);
  if (!registered) {
    await sleep(200);
  }
}
if (!registered) {
  console.error('the virtual mouse never appeared in dumpsys input');
  process.exit(1);
}

for (let step = 0; step < 40; step += 1) {
  move(-100, -100);
  delay(5);
}
await moveSlowly(1, 1);
const origin = readHoverPosition();
if (origin === undefined) {
  console.error('dumpsys input reports no hovering mouse pointer on this device');
  process.exit(1);
}
await moveSlowly(CALIBRATION_UNITS, CALIBRATION_UNITS);
let position = readHoverPosition() ?? origin;
const gain = {
  x: Math.max(0.25, (position.x - origin.x) / CALIBRATION_UNITS),
  y: Math.max(0.25, (position.y - origin.y) / CALIBRATION_UNITS),
};

for (let pass = 0; pass < 6; pass += 1) {
  const deltaX = target.x - position.x;
  const deltaY = target.y - position.y;
  if (Math.abs(deltaX) < 4 && Math.abs(deltaY) < 4) {
    break;
  }
  await moveSlowly(Math.round(deltaX / gain.x), Math.round(deltaY / gain.y));
  position = readHoverPosition() ?? position;
}

inject([EV_KEY, BUTTONS[buttonName], 1, EV_SYN, SYN_REPORT, 0]);
delay(80);
inject([EV_KEY, BUTTONS[buttonName], 0, EV_SYN, SYN_REPORT, 0]);
await sleep(1500);
const popups = (adb(['shell', 'dumpsys', 'window', 'windows']).match(/PopupWindow:/gu) ?? []).length;

session.stdin.end();
await new Promise((resolve) => {
  session.on('exit', resolve);
});
console.log(`${buttonName} click at (${position.x.toFixed(1)}, ${position.y.toFixed(1)}) for (${target.x}, ${target.y})`);
console.log(`popup windows: ${popups}`);
if (sessionOutput.trim().length > 0) {
  console.log(`uinput: ${sessionOutput.trim()}`);
}
