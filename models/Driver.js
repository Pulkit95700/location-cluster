class Driver {
    constructor(name) {
        this.name = name;
    }

    toJSON() {
        return {
            name: this.name,
        };
    }
}

export default Driver;