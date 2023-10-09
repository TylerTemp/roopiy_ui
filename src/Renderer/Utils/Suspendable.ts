enum Status {
    Pending,
    Fulfilled,
    Rejected,
}

export default <T>(promise:Promise<T>): (() => T) => {
    let status: Status = Status.Pending;
    let error: Error;
    let result: T;
    const suspender = promise.then((r: T): void => {
        status = Status.Fulfilled;
        result = r;
    })
        .catch(err => {
            status = Status.Rejected;
            error = err;
        });

    return () => {
        switch(status) {
            case Status.Pending:
                throw suspender;
            case Status.Rejected:
                throw error;
            case Status.Fulfilled:
                return result;
            default:
                throw Error(`Unexpected arg ${status}`);
        }
    }
};
