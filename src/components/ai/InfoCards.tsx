// components/InfoCards.tsx
import Tooltip from '@/components/Tooltip';
import tutorialMaterials from '@/components/ai/AiModelsTutorialMaterials.json';

interface InfoCardsProps {
  setOpenDialog: (dialog: string | null) => void;
}

export default function InfoCards({ setOpenDialog }: InfoCardsProps) {
  return (
    <div className="my-16 col-span-1 flex flex-col justify-start">
      <ul className="space-y-4 h-3/4 overflow-y-auto">
        {tutorialMaterials.map((item) => (
          <li key={item.dialogKey}>
            <Tooltip content={item.title}>
              <button
                onClick={() => setOpenDialog(item.dialogKey)}
                className="cursor-pointer w-full flex space-x-4 items-center bg-gray-100 text-gray-600 p-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <img src={item.icon} className="h-6 w-6" alt={`${item.title} icon`} />
                <div className="text-left flex-1">
                  <h4 className="text-sm font-medium text-gray-800">{item.title}</h4>
                  <p className="text-xs text-gray-600">{item.description.replace(/<[^>]+>/g, '').slice(0, 50)}...</p>
                </div>
              </button>
            </Tooltip>
          </li>
        ))}
      </ul>
    </div>
  );
}