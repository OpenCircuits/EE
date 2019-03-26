import "jest";

import {Battery} from "../../../../site/public/ts/models/eeobjects/Battery";

describe("Battery", () => {
    describe("New Battery, Default", () => {
        const battery = new Battery();

        expect(battery.getVoltage()).toBe(1);
    });
    describe("Example Batteries", () => {
        it ("Positive Voltage", () => {
            const battery = new Battery(2);
            expect(battery.getVoltage()).toBe(2);
        });
        it ("Negative Voltage", () => {
            //Should default to 1k Ohms
            const battery = new Battery(-1);
            expect(battery.getVoltage()).toBe(1);
        });
        it ("Zero Voltage", () => {
            //Should default to 1k Ohms
            const battery = new Battery(0);
            expect(battery.getVoltage()).toBe(1);
        });
    });
});
