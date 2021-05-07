import React, { createContext, useContext, useState } from "react"
import { View } from "react-native"
import LottieView from 'lottie-react-native';
import Assets from "../constants/Assets";

export type LoadingContextType = {
	push: () => void,
	pop: () => void
}

export const LoadingContext = createContext<LoadingContextType>({} as any);

export const useLoading: () => (<T> (f: () => Promise<T>) => Promise<T>) = () => {
	const ctx = useContext(LoadingContext);

	return async f => {
		ctx.push();
		try {
			const res = await f();
			return Promise.resolve(res);
		} catch(err) {
			return Promise.reject(err);
		} finally {
			ctx.pop();
		}
	}
}

export const LoadingAbsoluteView = ({ visible }: { visible: boolean }) => {
	if(!visible) return null
	return <View
		style={{
			position: "absolute",
			left: 0,
			top: 0,
			bottom: 0,
			right: 0,
			zIndex: 1001,
			alignItems: "center",
			justifyContent: "center",
			backgroundColor: "#88888888"
		}}
	>
		<LottieView autoPlay style={{ width: 100, height: 100, }} source={Assets.lottieBitcoin} />
	</View>
}

export const LoadingContextProvider = ({ children }: any) => {
	const [loadingCnt, setLoadingCnt] = useState(0);
	return <LoadingContext.Provider
		value={{
			push: () => setLoadingCnt(c => c + 1),
			pop: () => setLoadingCnt(c => c - 1),
		}}
	>
		{children}
		<LoadingAbsoluteView visible={loadingCnt > 0} />
	</LoadingContext.Provider>
}