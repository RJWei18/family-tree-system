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

const imageWidth = 1024;
const imageHeight = 768;

export const ExportButton: React.FC = () => {
    const { getNodes } = useReactFlow();
    const [isDownloading, setIsDownloading] = useState(false);

    const onClick = () => {
        setIsDownloading(true);
        // We try to find the .react-flow__viewport element
        // This assumes the standard class name layout of React Flow
        const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;

        if (!viewport) {
            console.error('Viewport not found');
            setIsDownloading(false);
            return;
        }

        // Calculate the bounds of all nodes to export the full tree
        const nodes = getNodes();
        const nodesBounds = getRectOfNodes(nodes);
        const transform = getTransformForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2);

        toPng(viewport, {
            backgroundColor: '#f8fafc', // slate-50
            width: imageWidth,
            height: imageHeight,
            style: {
                width: String(imageWidth),
                height: String(imageHeight),
                transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
            },
        }).then(downloadImage)
            .catch((err) => {
                console.error('Export failed', err);
            })
            .finally(() => {
                setIsDownloading(false);
            });
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
