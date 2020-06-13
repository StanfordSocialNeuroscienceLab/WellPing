/**
 * This function should be used like
 * `if (__DEV__ && _DEBUG_CONFIGS().something) {`
 * so that the code will not execute in production.
 */

export function _DEBUG_CONFIGS() {
	return {
		ignoreLogin: true,
		ignoreNotificationTime: true,
	};
}

export function logError(error: any) {
	console.error(error);
}
