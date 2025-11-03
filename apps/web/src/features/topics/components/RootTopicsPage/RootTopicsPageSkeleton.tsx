import { useCallback, useMemo } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { Card, CardContent } from '~/components/ui/Card'
import { Skeleton } from '~/components/ui/Skeleton'

const MIN_CARD_WIDTH = 280
const MIN_HEIGHT = 96

export function RootTopicsPageSkeleton() {
    // Create skeleton items for loading state with random content lengths
    const skeletonItems = useMemo(
        () =>
            Array.from({ length: 45 }).map((_, index) => ({
                id: `skeleton-${index}`,
                name: '',
                notes: '',
                // Random number of name lines (1-3)
                nameLines: Math.floor(Math.random() * 3) + 1,
                // Random number of notes lines (0-4)
                notesLines: Math.floor(Math.random() * 5)
            })),
        []
    )

    const renderSkeletonItem = useCallback(
        (skeleton: { id: string; nameLines: number; notesLines: number }) => (
            <Card className='p-0' key={skeleton.id}>
                <CardContent
                    className='flex h-full flex-col justify-between gap-3 px-3 py-3'
                    style={{ minHeight: `${MIN_HEIGHT}px` }}
                >
                    <div className='flex flex-col gap-2.5'>
                        {/* Top row */}
                        <div className='flex items-center justify-between'>
                            <Skeleton className='h-3 w-8' />
                            <Skeleton className='h-5 w-5 rounded' />
                        </div>

                        <div className='flex flex-col gap-1'>
                            {/* Topic name skeleton - variable lines */}
                            {Array.from({ length: skeleton.nameLines }).map((_, i) => (
                                <Skeleton
                                    key={`${skeleton.id}-name-${i}`}
                                    className={`h-5 ${i === skeleton.nameLines - 1 ? 'w-3/4' : 'w-full'}`}
                                />
                            ))}
                            {/* Topic notes skeleton - variable lines */}
                            {Array.from({ length: skeleton.notesLines }).map((_, i) => (
                                <Skeleton
                                    key={`${skeleton.id}-notes-${i}`}
                                    className={`h-4 ${i === skeleton.notesLines - 1 ? 'w-5/6' : 'w-full'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Bottom row */}
                    <div className='flex items-center justify-between'>
                        <Skeleton className='h-3 w-20' />
                        <Skeleton className='h-3 w-8' />
                    </div>
                </CardContent>
            </Card>
        ),
        []
    )

    const getSkeletonKey = useCallback(
        (skeleton: { id: string }) => skeleton.id,
        []
    )

    const estimateSkeletonSize = useCallback(() => MIN_HEIGHT, [])

    return (
        <div className='p-6 pt-2'>
            <MasonryLayout
                estimateItemSize={estimateSkeletonSize}
                gap={16}
                getItemKey={getSkeletonKey}
                items={skeletonItems}
                minItemWidth={MIN_CARD_WIDTH}
                renderItem={renderSkeletonItem}
            />
        </div>
    )
}

