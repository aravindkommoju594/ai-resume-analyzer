import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Navbar from "~/components/Navbar";
import ScoreCircle from "~/components/ScoreCircle";
import { usePuterStore } from "~/lib/puter";

const feedbackSections = [
  { key: "ATS", title: "ATS Match" },
  { key: "toneAndStyle", title: "Tone & Style" },
  { key: "content", title: "Content" },
  { key: "structure", title: "Structure" },
  { key: "skills", title: "Skills" },
] as const;

type FeedbackSectionKey = (typeof feedbackSections)[number]["key"];

const FeedbackTip = ({
  type,
  tip,
  explanation,
}: {
  type: "good" | "improve";
  tip: string;
  explanation?: string;
}) => {
  const isGood = type === "good";

  return (
    <li className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-row items-start gap-3">
        <span
          className={`score-badge flex-shrink-0 text-sm font-semibold ${
            isGood
              ? "bg-badge-green text-badge-green-text"
              : "bg-badge-yellow text-badge-yellow-text"
          }`}
        >
          {isGood ? "Good" : "Improve"}
        </span>

        <div className="flex flex-col gap-1">
          <p className="font-semibold text-gray-900">{tip}</p>
          {explanation && (
            <p className="text-sm leading-6 text-dark-200">{explanation}</p>
          )}
        </div>
      </div>
    </li>
  );
};

const FeedbackSection = ({
  title,
  section,
}: {
  title: string;
  section?: Feedback[FeedbackSectionKey];
}) => {
  if (!section) return null;

  return (
    <article className="feedback-card">
      <div className="flex flex-row items-center justify-between gap-4">
        <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
        <strong className="text-xl text-[#606beb]">{section.score}/100</strong>
      </div>

      {section.tips?.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {section.tips.map((item, index) => (
            <FeedbackTip
              key={`${title}-${index}`}
              type={item.type}
              tip={item.tip}
              explanation={"explanation" in item ? item.explanation : undefined}
            />
          ))}
        </ul>
      ) : (
        <p className="text-dark-200">No detailed feedback available.</p>
      )}
    </article>
  );
};

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

  const feedback = resume.feedback;

  return (
    <main className="bg-[url('/images/bg-main.svg)] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading">
          <h1>{resume.companyName}</h1>
          <h2>{resume.jobTitle}</h2>
          <button
            type="button"
            onClick={() => window.print()}
            className="primary-button max-w-[240px]"
          >
            Print Feedback
          </button>
        </div>

        <div className="resume-review-layout">
          <div className="resume-preview-panel">
            {imageUrl ? (
              <div className="gradient-border w-full">
                <img
                  src={imageUrl}
                  alt="resume"
                  className="w-full rounded-2xl"
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-8 text-center text-dark-200">
                Resume preview unavailable.
              </div>
            )}
          </div>

          <div className="resume-review-panel">
            <div className="resume-summary">
              <ScoreCircle score={feedback.overallScore} />
              <div className="category">
                <p>ATS</p>
                <strong>{feedback.ATS.score}/100</strong>
              </div>
              <div className="category">
                <p>Skills</p>
                <strong>{feedback.skills.score}/100</strong>
              </div>
            </div>

            <div className="feedback-grid">
              {feedbackSections.map(({ key, title }) => (
                <FeedbackSection
                  key={key}
                  title={title}
                  section={feedback[key]}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Resume;
