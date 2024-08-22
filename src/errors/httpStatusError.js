class HttpStatusError extends Error {
	constructor(message, errorCode) {
		super(message);
		this.name = this.constructor.name;
		this.errorCode = errorCode;
		this.date = new Date();

		Error.captureStackTrace(this, this.constructor);
	}
}

export { HttpStatusError };
