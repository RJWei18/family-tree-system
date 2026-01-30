import React, { useState } from 'react';
import { useReactFlow, getRectOfNodes, getTransformForBounds } from 'reactflow';
import { toPng } from 'html-to-image';
import { Download, Loader2 } from 'lucide-react';

function downloadImage(dataUrl: string) {
    const a = document.createElement('a');
    a.setAttribute('download', 'family-tree.png');
    a.setAttribute('href', dataUrl);
    // Append to body is required for some browsers (Firefox, etc.) to trigger download correctly
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}



export const ExportButton: React.FC = () => {
    const { getNodes } = useReactFlow();
    const [isDownloading, setIsDownloading] = useState(false);

    const onClick = async () => {
        setIsDownloading(true);
        try {
            // 1. Selector Check
            const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
            if (!viewport) {
                console.error('Viewport not found');
                alert('匯出失敗：找不到畫布元件，請重新整理頁面再試一次。');
                setIsDownloading(false);
                return;
            }

            // 2. Nodes Check
            const nodes = getNodes();
            if (nodes.length === 0) {
                alert('目前沒有家族成員可供匯出。');
                setIsDownloading(false);
                return;
            }

            // 3. Calculate Bounds
            const nodesBounds = getRectOfNodes(nodes);
            const padding = 50;
            const width = nodesBounds.width + padding * 2;
            const height = nodesBounds.height + padding * 2;
            const transform = getTransformForBounds(nodesBounds, width, height, 0.5, 2);

            // 4. Generate Image
            const options = {
                backgroundColor: '#ffffff',
                width: width,
                height: height,
                style: {
                    width: String(width),
                    height: String(height),
                    transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
                },
                pixelRatio: 1.5, // Balanced quality
                filter: (node: HTMLElement) => {
                    // Safe access to classList
                    const classList = node.classList;
                    if (!classList) return true;
                    // Exclude UI elements just in case
                    return !classList.contains('react-flow__minimap') &&
                        !classList.contains('react-flow__controls') &&
                        !classList.contains('react-flow__panel');
                }
            };

            try {
                const dataUrl = await toPng(viewport, options);
                downloadImage(dataUrl);
            } catch (firstErr) {
                console.warn('First export attempt failed, retrying with simplified options...', firstErr);
                // Retry with simplified options
                try {
                    const dataUrl = await toPng(viewport, {
                        ...options,
                        pixelRatio: 1,
                        skipFonts: true,
                    });
                    downloadImage(dataUrl);
                } catch (retryErr: any) {
                    console.error('Retry export failed', retryErr);
                    // Extract detailed error info
                    const errorMessage = retryErr.message || (retryErr instanceof Event ? 'Network/CORS Error' : 'Unknown Error');

                    // Specific hints for common issues
                    let hint = '可能原因：圖片跨域問題或瀏覽器限制。';
                    if (errorMessage.includes('Failed to fetch')) hint = '可能原因：圖片載入失敗 (CORS)。';

                    alert(`匯出失敗 (重試後仍失敗)：${errorMessage}\n\n${hint}`);
                }
            }

        } catch (err: any) {
            console.error('Export setup failed', err);
            alert('匯出設定發生錯誤：' + (err.message || '未知原因'));
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            onClick={onClick}
            disabled={isDownloading}
        >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            匯出圖片
        </button>
    );
};
