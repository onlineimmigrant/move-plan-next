import Link from 'next/link';
import AdvancedVideoPlayer from '@/components/AdvancedVideoPlayer';


export default function BecomeAffiliatePartner() {
    const videos = [
        { id: '1', src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', title: 'Big Buck Bunny (External)' },
        { id: '2', publicId: 'samples/elephants', title: 'Cloudinary Elephants' },
        { id: '3', publicId: 'samples/sea-turtle', title: 'Cloudinary Sea Turtle' },
      ];
    return (
        <div className='mt-16 '>
<main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Universal Advanced Video Player</h1>

      <section className="container">
        <h2 className="text-xl font-semibold mb-2">Default Videos</h2>
        <ul className="videos">
          {videos.map((video) => (
            <li key={video.id}>
              <h3 className="text-lg font-medium">{video.title}</h3>
              <AdvancedVideoPlayer
                src={video.src}
                publicId={video.publicId}
                controls
                className="max-w-full"
              />
            </li>
          ))}
        </ul>
      </section>

      <AdvancedVideoPlayer
          src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          controls
          className="max-w-2xl mx-auto"
          thumbnailTime={5} // Capture thumbnail at 5 seconds
        />
        <AdvancedVideoPlayer
          src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          poster="https://res.cloudinary.com/dzagcqrbp/image/upload/v1746772363/tcqbunib9fqg0gpxnu7j.jpg"
          controls
          className="max-w-2xl mx-auto mt-4"
        />

      <section className="container">
        <h2 className="text-xl font-semibold mb-2">Optimized Cloudinary Video</h2>
        <AdvancedVideoPlayer
          publicId="samples/elephants"
          mode="optimized"
          controls
          className="max-w-2xl mx-auto"
        />
      </section>

      <section className="container">
        <h2 className="text-xl font-semibold mb-2">Dynamic Cropping</h2>
        <ul className="videos">
          <li>
            <h3 className="text-lg font-medium">YouTube Style (16:9)</h3>
            <AdvancedVideoPlayer
              publicId="drudssthgn5ytnviajp0"
              poster="https://res.cloudinary.com/dzagcqrbp/image/upload/v1746772363/tcqbunib9fqg0gpxnu7j.jpg"
              mode="cropped-youtube"
              controls
              autoPlay
              loop
              className="max-w-full"
            />
          </li>
         
          <li>
            <h3 className="text-lg font-medium">Mobile (9:16)</h3>
            <AdvancedVideoPlayer
              publicId="qtb7tp6be8ieejtyvzqq"
              mode="cropped-mobile"
              controls
              autoPlay
              loop
              className="max-w-full"
            />
          </li>
          <li>
            <h3 className="text-lg font-medium">Square (1:1)</h3>
            <AdvancedVideoPlayer
              publicId="samples/elephants"
              mode="cropped-square"
              controls
              autoPlay
              loop
              className="max-w-full"
            />
          </li>
        </ul>
      </section>

      <section className="container">
        <h2 className="text-xl font-semibold mb-2">Preview Clip</h2>
        <AdvancedVideoPlayer
          publicId="drudssthgn5ytnviajp0"
          mode="preview"
          autoPlay
          muted
          loop
          className="max-w-2xl mx-auto"
        />
      </section>
    </main>
        </div>
          );
        }