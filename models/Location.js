import { GeoPoint } from "firebase-admin/firestore";

class Location {
    constructor(latitude, longitude, driverId, createdAt = new Date(Date.now())) {
        this.coords = new GeoPoint(latitude, longitude);
        this.driverId = driverId;
        this.createdAt = createdAt;
    }

    toJSON() {
        return {
            coords: this.coords,
            driverId: this.driverId,
            createdAt: this.createdAt,
        };
    }
}

export default Location;
