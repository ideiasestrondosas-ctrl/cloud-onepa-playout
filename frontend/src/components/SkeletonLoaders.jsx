/**
 * SkeletonLoaders.jsx - Reusable Skeleton Loading Components
 * Para uso em páginas que precisam de feedback de carregamento
 */
import React from 'react';
import { Box, Skeleton, Card, CardContent, Grid } from '@mui/material';

/**
 * CardSkeleton - Loading skeleton for card components
 */
export const CardSkeleton = ({ height = 200 }) => (
    <Card sx={{ height }}>
        <CardContent>
            <Skeleton variant="text" width="60%" height={30} />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="rectangular" height={100} sx={{ mt: 2, borderRadius: 1 }} />
        </CardContent>
    </Card>
);

/**
 * TableSkeleton - Loading skeleton for table components
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
    <Box>
        <Skeleton variant="text" width="30%" height={40} />
        {Array.from({ length: rows }).map((_, index) => (
            <Skeleton
                key={index}
                variant="rectangular"
                height={50}
                sx={{ mt: 1, borderRadius: 1 }}
            />
        ))}
    </Box>
);

/**
 * FormSkeleton - Loading skeleton for form components
 */
export const FormSkeleton = ({ fields = 4 }) => (
    <Box>
        <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
        {Array.from({ length: fields }).map((_, index) => (
            <Box key={index} sx={{ mb: 2 }}>
                <Skeleton variant="text" width="20%" height={20} sx={{ mb: 0.5 }} />
                <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 3 }} />
            </Box>
        ))}
    </Box>
);

/**
 * MediaCardSkeleton - Loading skeleton for media cards
 */
export const MediaCardSkeleton = () => (
    <Card sx={{ height: 200 }}>
        <Skeleton variant="rectangular" height={120} />
        <CardContent>
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="40%" />
        </CardContent>
    </Card>
);

/**
 * MediaGridSkeleton - Loading skeleton for media grid
 */
export const MediaGridSkeleton = ({ count = 8 }) => (
    <Grid container spacing={2}>
        {Array.from({ length: count }).map((_, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
                <MediaCardSkeleton />
            </Grid>
        ))}
    </Grid>
);

/**
 * SettingsTabSkeleton - Loading skeleton for settings tabs
 */
export const SettingsTabSkeleton = () => (
    <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="30%" height={40} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
            {Array.from({ length: 6 }).map((_, index) => (
                <Grid item xs={12} md={6} key={index}>
                    <Skeleton variant="text" width="20%" height={20} sx={{ mb: 0.5 }} />
                    <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 3 }} />
                </Grid>
            ))}
        </Grid>
    </Box>
);

/**
 * DashboardSkeleton - Loading skeleton for dashboard
 */
export const DashboardSkeleton = () => (
    <Box>
        <Grid container spacing={3}>
            {/* Stats Cards */}
            {Array.from({ length: 4 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <CardSkeleton height={120} />
                </Grid>
            ))}

            {/* Main Content */}
            <Grid item xs={12} md={8}>
                <CardSkeleton height={400} />
            </Grid>
            <Grid item xs={12} md={4}>
                <CardSkeleton height={400} />
            </Grid>
        </Grid>
    </Box>
);

/**
 * PlaylistEditorSkeleton - Loading skeleton for playlist editor
 */
export const PlaylistEditorSkeleton = () => (
    <Box>
        <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
                <CardSkeleton height={500} />
            </Grid>
            <Grid item xs={12} md={4}>
                <CardSkeleton height={500} />
            </Grid>
        </Grid>
    </Box>
);

export default {
    CardSkeleton,
    TableSkeleton,
    FormSkeleton,
    MediaCardSkeleton,
    MediaGridSkeleton,
    SettingsTabSkeleton,
    DashboardSkeleton,
    PlaylistEditorSkeleton,
};
