import { memo } from 'react';

export const FamilyGroupNode = memo(() => {
    return (
        <div className="w-full h-full relative pointer-events-none">
            {/* 
        Container for the family group. 
        React Flow handles the grouping logic via parentNode.
        We can add a subtle border or background if debugging, 
        but usually it's invisible or very subtle.
      */}
            {/* <div className="absolute inset-0 border border-dashed border-stone-300/50 rounded-3xl" /> */}
        </div>
    );
});
