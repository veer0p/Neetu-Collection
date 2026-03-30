import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

const CONTENT_MAX_WIDTH = 640;
const DESKTOP_MAX_WIDTH = 1024;

export function useResponsive() {
    const [dims, setDims] = useState(() => Dimensions.get('window'));

    useEffect(() => {
        const sub = Dimensions.addEventListener('change', ({ window }) => {
            setDims(window);
        });
        return () => sub.remove();
    }, []);

    const isWeb = Platform.OS === 'web';
    const isWide = dims.width >= 768;

    // Content container: on web, cap at CONTENT_MAX_WIDTH and center
    const containerStyle = isWeb
        ? {
            maxWidth: CONTENT_MAX_WIDTH,
            width: '100%' as const,
            alignSelf: 'center' as const,
        }
        : {};
        
    // Desktop container: on web, cap at DESKTOP_MAX_WIDTH and center
    const desktopContainerStyle = isWeb
        ? {
            maxWidth: DESKTOP_MAX_WIDTH,
            width: '100%' as const,
            alignSelf: 'center' as const,
        }
        : {};

    // Full-width container that self-centers
    const wrapperStyle = isWeb
        ? {
            flex: 1,
            alignItems: 'center' as const,
        }
        : { flex: 1 };

    return {
        isWeb,
        isWide,
        windowWidth: dims.width,
        windowHeight: dims.height,
        /** Apply to a scroll/flatlist content container on web to cap width */
        containerStyle,
        /** Apply to wide content like Dashboards or Ledgers on web */
        desktopContainerStyle,
        /** Apply to a View that wraps a scroll area, centers content on web */
        wrapperStyle,
        CONTENT_MAX_WIDTH,
        DESKTOP_MAX_WIDTH,
    };
}
