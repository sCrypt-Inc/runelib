
interface IOption<T> {
    isSome: () => boolean

    value: () => T;
}
class None implements IOption<null> {

    constructor() { }
    isSome (): boolean {
        return false;
    }

    map(f: (a: never) => unknown): None {
        return new None();
    }

    value (): null {
        return null;
    }
}

class Some<T> implements IOption<T> {
    private readonly _value: T;

    constructor(value: T) {
        this._value = value;
    }

    isSome (): boolean {
        return true;
    }

    map<S>(f: (a: T) => S): Some<S> {
        return new Some(f(this.value()));
    }

    value (): T {
        return this._value;
    }

}


export function some<T>(t: T): Some<T> {
    return new Some(t);
}

export function none(): None {
    return new None();
}

export type Option<T> = None | Some<T>;