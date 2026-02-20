type PathCardProps = {
  name: string;
  description: string;
  mainPillar: string;
  supports: string[];
};

export default function PathCard({
  name,
  description,
  mainPillar,
  supports
}: PathCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-300 bg-[#fdf9f1] p-6 shadow-sm transition hover:shadow-md">
      <h2 className="mb-2 text-lg font-semibold text-neutral-950">{name}</h2>

      <p className="mb-4 text-sm leading-relaxed text-neutral-800">
        {description}
      </p>

      <div className="text-sm text-neutral-900">
        <p className="mb-1">
          <span className="font-semibold text-neutral-950">Main pillar:</span>{" "}
          {mainPillar}
        </p>
        <p>
          <span className="font-semibold text-neutral-950">Supporting:</span>{" "}
          {supports.join(" + ")}
        </p>
      </div>
    </div>
  );
}
