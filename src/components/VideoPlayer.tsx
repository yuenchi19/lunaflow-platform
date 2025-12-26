import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
    videoUrl: string;
    poster?: string;
}

export default function VideoPlayer({ videoUrl, poster }: VideoPlayerProps) {
    return (
        <div className={styles.container}>
            <video
                className={styles.video}
                controls
                poster={poster}
                src={videoUrl}
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
}
