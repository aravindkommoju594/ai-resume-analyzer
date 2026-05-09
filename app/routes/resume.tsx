import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Navbar from "~/components/Navbar";
import ScoreCircle from "~/components/ScoreCircle";
import { usePuterStore } from "~/lib/puter";

const Resume = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth, kv, fs } = usePuterStore();
  const [resume, setResume] = useState<Resume | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [statusText, setStatusText] = useState("Loading resume...");

  useEffect(() => {
    if (!auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
  }, [auth.isAuthenticated, id, navigate]);

  useEffect(() => {
    const loadResume = async () => {
      if (!id) return;

      const data = await kv.get(`resume:${id}`);
      if (!data) {
        setStatusText("Resume not found");
        return;
      }

      const parsedResume = JSON.parse(data) as Resume;
      setResume(parsedResume);

      const image = await fs.read(parsedResume.imagePath);
      if (image) setImageUrl(URL.createObjectURL(image));
    };

    loadResume();
  }, [fs, id, kv]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  if (!resume) {
    return (
      <main className="bg-[url('/images/bg-main.svg)] bg-cover">
        <Navbar />
        <section className="main-section">
          <h2>{statusText}</h2>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[url('/images/bg-main.svg)] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading">
          <h1>{resume.companyName}</h1>
          <h2>{resume.jobTitle}</h2>
        </div>

        <div className="resume-summary">
          <ScoreCircle score={resume.feedback.overallScore} />
          <div className="category">
            <p>ATS</p>
            <strong>{resume.feedback.ATS.score}/100</strong>
          </div>
          <div className="category">
            <p>Skills</p>
            <strong>{resume.feedback.skills.score}/100</strong>
          </div>
        </div>

        {imageUrl && (
          <div className="gradient-border w-full max-w-4xl">
            <img src={imageUrl} alt="resume" className="w-full rounded-2xl" />
          </div>
        )}
      </section>
    </main>
  );
};

export default Resume;
